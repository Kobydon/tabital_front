#!/usr/bin/env python3
"""
Tabital Pay brand-asset pipeline.

Reads the founder's original logo files from ``brand/source/`` and writes every
logo/icon asset the Angular app needs into ``src/assets/brand/`` (or ``--out``).

    python prepare_logo.py                       # defaults: ./source -> ../src/assets/brand
    python prepare_logo.py --source DIR --out DIR

Inputs (case-insensitive names, SVG preferred, PNG >= 1024 px on transparency otherwise):
    logo.svg | logo.png   full logo: mark + "Tabital Pay" wordmark (optional if mark.* is given:
                          then logo-on-* are the mark alone and the app sets the wordmark as HTML text)
    mark.svg | mark.png   the square mark alone (optional, derived from logo if missing)

Outputs:
    mark-32/64/128/256.png          square, transparent, trimmed, centred, ~8 % padding
    logo-on-white@1x/@2x.png        48 / 96 px high, original colours
    logo-on-navy@1x/@2x.png         48 / 96 px high, dark wordmark recoloured to white
    favicon.ico                     16, 32, 48
    apple-touch-icon.png            180, mark on navy #02163f with padding
    icon-192.png, icon-512.png      maskable: mark inside the 80 % safe circle on navy
    report.json                     colours, nearest brand token + delta E, WCAG contrast, warnings

The script is deterministic and idempotent (re-running overwrites the same files with the
same bytes), never touches the network and only writes into the output folder.
Requires Pillow. SVG input additionally needs ``cairosvg`` (optional).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

try:
    from PIL import Image, ImageChops, ImageFilter
except ImportError:  # pragma: no cover - environment problem, not logic
    sys.stderr.write(
        "ERROR: Pillow is not installed in this Python.\n"
        "       Run: python -m pip install -r tabital_front/brand/requirements.txt\n"
    )
    sys.exit(3)

# --------------------------------------------------------------------------------------
# Brand constants (from tabitalpay.com / CLAUDE.md). Kept here, not in the app code.
# --------------------------------------------------------------------------------------
BRAND_TOKENS: dict[str, str] = {
    "gold": "#f5b700",
    "gold-hover": "#e8a400",
    "navy": "#02163f",
    "navy-2": "#0a2d73",
    "slate": "#475569",
    "background": "#f8f9fc",
    "line": "#e2e8f0",
    "logo-ochre": "#c69435",
    "logo-charcoal": "#5e5d5b",
    "white": "#ffffff",
}
NAVY = (0x02, 0x16, 0x3F)
WHITE = (0xFF, 0xFF, 0xFF)

MARK_SIZES = (32, 64, 128, 256)
MARK_PADDING = 0.08            # each side, as a fraction of the canvas
APPLE_TOUCH_SIZE = 180
APPLE_TOUCH_PADDING = 0.14     # each side
MASKABLE_SIZES = (192, 512)
MASKABLE_SAFE_DIAMETER = 0.80  # W3C maskable safe zone: circle, 80 % of the icon
FAVICON_SIZES = (16, 32, 48)
LOGO_HEIGHTS = {"@1x": 48, "@2x": 96}

SVG_RENDER_LONG_SIDE = 2048    # px, when rasterising SVG input
ALPHA_VISIBLE = 8              # alpha above this counts as content when trimming
ALPHA_OPAQUE = 200             # alpha at/above this counts as a "solid" pixel for colour stats
MIN_SOURCE_PX = 512
DRIFT_DELTA_E = 10.0
MIN_SHARE_FOR_CHECKS = 0.05    # colours covering < 5 % of solid pixels are anti-aliasing noise
MIN_EDGE_SHARE = 0.02          # contrast checks look at outline pixels only; ignore < 2 % of them
WCAG_GRAPHIC_MIN = 3.0         # WCAG 1.4.11 non-text / 1.4.3 large text
WCAG_TEXT_MIN = 4.5            # WCAG 1.4.3 normal text (informational for a logo)

# Recolouring for the on-navy logo. Soft ramps (not hard thresholds) so anti-aliased
# pixels are blended proportionally. weight = darkness(luminance) * (1 - warmth(R - B)).
LUM_FULL, LUM_NONE = 120, 170      # luminance <= 120 fully "dark", >= 170 not dark
WARM_NONE, WARM_FULL = 40, 90      # R-B <= 40 neutral/cool, >= 90 gold/ochre (kept)
MIN_RECOLOUR_SHARE = 0.005         # < 0.5 % of solid pixels dark -> "no dark wordmark"

EXIT_INPUT_ERROR = 2


class BrandError(Exception):
    """A problem with the inputs that the founder/developer can fix."""


# --------------------------------------------------------------------------------------
# Colour maths
# --------------------------------------------------------------------------------------
def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def rgb_to_hex(rgb) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb[:3])


def _srgb_to_linear(c: float) -> float:
    c /= 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def rgb_to_lab(rgb) -> tuple[float, float, float]:
    r, g, b = (_srgb_to_linear(v) for v in rgb[:3])
    x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
    y = (0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / 1.00000
    z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883

    def f(t: float) -> float:
        return t ** (1 / 3) if t > 216 / 24389 else (24389 / 27 * t + 16) / 116

    fx, fy, fz = f(x), f(y), f(z)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def delta_e76(a, b) -> float:
    la, lb = rgb_to_lab(a), rgb_to_lab(b)
    return math.sqrt(sum((p - q) ** 2 for p, q in zip(la, lb)))


def relative_luminance(rgb) -> float:
    r, g, b = (_srgb_to_linear(v) for v in rgb[:3])
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(a, b) -> float:
    la, lb = relative_luminance(a), relative_luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def nearest_token(rgb) -> tuple[str, float]:
    best = min(BRAND_TOKENS.items(), key=lambda kv: delta_e76(rgb, hex_to_rgb(kv[1])))
    return best[0], delta_e76(rgb, hex_to_rgb(best[1]))


# --------------------------------------------------------------------------------------
# Loading
# --------------------------------------------------------------------------------------
def find_source(src_dir: Path, stem: str) -> dict[str, Path]:
    found: dict[str, Path] = {}
    for p in sorted(src_dir.iterdir()):
        if p.is_file() and p.stem.lower() == stem and p.suffix.lower() in (".svg", ".png"):
            found[p.suffix.lower()] = p
    return found


def _render_svg(path: Path) -> Image.Image:
    try:
        import cairosvg  # type: ignore
    except (ImportError, OSError) as exc:  # OSError: cairosvg present but Cairo DLL missing
        raise BrandError(
            f"{path.name} is an SVG, but SVG rendering is not available ({exc.__class__.__name__}: {exc}).\n"
            "  Option A (easiest): also export the logo as PNG (>= 1024 px, transparent background)\n"
            f"            and save it next to it as {path.stem}.png - the PNG will be used.\n"
            "  Option B: pip install cairosvg  (on Windows it also needs the Cairo library, e.g. from\n"
            "            the GTK runtime, on PATH)."
        ) from None
    import io

    probe = Image.open(io.BytesIO(cairosvg.svg2png(url=str(path))))
    scale = SVG_RENDER_LONG_SIDE / max(probe.size)
    data = cairosvg.svg2png(url=str(path), scale=scale)
    return Image.open(io.BytesIO(data))


def load_source(files: dict[str, Path], label: str, warnings: list[str]) -> tuple[Image.Image, dict]:
    """Pick SVG if it can be rendered, else PNG. Returns an RGBA image and metadata."""
    chosen: Path | None = None
    im: Image.Image | None = None
    svg_error: BrandError | None = None
    if ".svg" in files:
        try:
            im = _render_svg(files[".svg"])
            chosen = files[".svg"]
        except BrandError as exc:
            svg_error = exc
    if im is None and ".png" in files:
        chosen = files[".png"]
        if svg_error is not None:
            warnings.append(f"{label}: SVG could not be rendered (cairosvg unavailable); used {chosen.name} instead.")
        try:
            im = Image.open(chosen)
            im.load()
        except Exception as exc:
            raise BrandError(f"{chosen.name} could not be read as a PNG: {exc}") from None
    if im is None:
        raise svg_error or BrandError(f"no usable {label} file")

    assert chosen is not None
    original_mode = im.mode
    im = im.convert("RGBA")
    alpha_min = im.getchannel("A").getextrema()[0]
    meta = {
        "file": chosen.name,
        "sha256": hashlib.sha256(chosen.read_bytes()).hexdigest(),
        "format": chosen.suffix.lower().lstrip("."),
        "mode": original_mode,
        "size": list(im.size),
        "has_transparency": alpha_min < 255,
    }
    w, h = im.size
    if label == "mark":
        if min(w, h) < MIN_SOURCE_PX:
            warnings.append(f"mark: source is {w}x{h}px; smaller than {MIN_SOURCE_PX}px - icons may look soft. Send >= 1024px or SVG.")
        if abs(w - h) > 0.02 * max(w, h):
            warnings.append(f"mark: source is not square ({w}x{h}); it will be trimmed and centred on a square canvas.")
    elif max(w, h) < MIN_SOURCE_PX:
        warnings.append(f"logo: source is {w}x{h}px; smaller than {MIN_SOURCE_PX}px on its long side - send >= 1024px or SVG.")
    if not meta["has_transparency"]:
        warnings.append(
            f"{label}: {chosen.name} has no transparency (solid background). Outputs keep that background, "
            "so the on-navy logo and navy icons will show a box. Please send a transparent PNG or SVG."
        )
    return im, meta


# --------------------------------------------------------------------------------------
# Geometry helpers
# --------------------------------------------------------------------------------------
def content_mask(im: Image.Image) -> Image.Image:
    """L-mode 0/255 mask of the visible content."""
    alpha = im.getchannel("A")
    if alpha.getextrema()[0] < 255:
        return alpha.point(lambda v: 255 if v > ALPHA_VISIBLE else 0)
    # Opaque image: treat the (agreeing) corner colour as background.
    w, h = im.size
    corners = [im.getpixel(p)[:3] for p in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))]
    bg = corners[0]
    if any(delta_e76(c, bg) > 5 for c in corners):
        return Image.new("L", im.size, 255)  # no clear background: keep everything
    diff = ImageChops.difference(im.convert("RGB"), Image.new("RGB", im.size, bg)).convert("L")
    return diff.point(lambda v: 255 if v > 24 else 0)


def trim(im: Image.Image) -> Image.Image:
    bbox = content_mask(im).getbbox()
    if bbox is None:
        raise BrandError("the image is empty (fully transparent)")
    return im.crop(bbox)


def _runs(occupied: list[bool], min_gap: int) -> list[tuple[int, int]]:
    runs: list[tuple[int, int]] = []
    start = None
    gap = 0
    for i, occ in enumerate(occupied):
        if occ:
            if start is None:
                start = i
            elif gap >= min_gap:
                runs.append((start, i - gap))
                start = i
            gap = 0
        elif start is not None:
            gap += 1
    if start is not None:
        runs.append((start, len(occupied) - gap))
    return runs


def detect_mark_box(logo: Image.Image) -> tuple[int, int, int, int] | None:
    """Find the square mark inside a trimmed full logo: the first block (left, else top)
    separated from the rest by a clear gap. Returns a box in logo coordinates or None."""
    mask = content_mask(logo)
    w, h = mask.size
    data = mask.tobytes()
    cols = [max(data[x::w]) > 0 for x in range(w)]
    rows = [max(data[y * w:(y + 1) * w]) > 0 for y in range(h)]
    for axis, occ, length in (("x", cols, w), ("y", rows, h)):
        runs = _runs(occ, max(2, int(0.03 * length)))
        if len(runs) < 2:
            continue
        a, b = runs[0]
        box = (a, 0, b, h) if axis == "x" else (0, a, w, b)
        sub = mask.crop(box).getbbox()
        if sub is None:
            continue
        box = (box[0] + sub[0], box[1] + sub[1], box[0] + sub[2], box[1] + sub[3])
        bw, bh = box[2] - box[0], box[3] - box[1]
        aspect = bw / bh
        big_enough = (bh >= 0.6 * h) if axis == "x" else (bw >= 0.6 * w)
        if 0.6 <= aspect <= 1.67 and big_enough:
            return box
    return None


def _resize(im: Image.Image, size: tuple[int, int]) -> Image.Image:
    # Resample in premultiplied alpha so transparent pixels don't bleed dark fringes.
    return im.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")


def place(content: Image.Image, canvas: int, max_w: float, max_h: float,
          bg: tuple[int, int, int, int]) -> Image.Image:
    cw, ch = content.size
    scale = min(max_w / cw, max_h / ch)
    nw, nh = max(1, round(cw * scale)), max(1, round(ch * scale))
    scaled = _resize(content, (nw, nh))
    out = Image.new("RGBA", (canvas, canvas), bg)
    out.alpha_composite(scaled, ((canvas - nw) // 2, (canvas - nh) // 2))
    return out


def fit_height(im: Image.Image, height: int) -> Image.Image:
    w, h = im.size
    return _resize(im, (max(1, round(w * height / h)), height))


# --------------------------------------------------------------------------------------
# Recolouring for navy backgrounds
# --------------------------------------------------------------------------------------
def _ramp(lo: int, hi: int, rising: bool) -> list[int]:
    lut = []
    for v in range(256):
        t = 0.0 if v <= lo else 1.0 if v >= hi else (v - lo) / (hi - lo)
        lut.append(round(255 * (t if rising else 1 - t)))
    return lut


def recolour_for_navy(logo: Image.Image, keep_box) -> tuple[Image.Image, float]:
    """Blend dark, non-warm pixels (charcoal / near-black / slate / navy wordmark) towards
    white, weighted by luminance and warmth; gold/ochre pixels and the mark area are kept.
    Alpha is untouched, so anti-aliased edges stay smooth. Returns (image, share recoloured)."""
    rgb = logo.convert("RGB")
    r, _g, b = rgb.split()
    darkness = rgb.convert("L").point(_ramp(LUM_FULL, LUM_NONE, rising=False))
    not_warm = ImageChops.subtract(r, b).point(_ramp(WARM_NONE, WARM_FULL, rising=False))
    weight = ImageChops.multiply(darkness, not_warm)
    if keep_box is not None:
        weight.paste(0, keep_box)
    solid = logo.getchannel("A").point(lambda v: 255 if v >= ALPHA_OPAQUE else 0)
    solid_count = solid.histogram()[255]
    strong = ImageChops.multiply(weight.point(lambda v: 255 if v >= 128 else 0), solid).histogram()[255]
    share = strong / solid_count if solid_count else 0.0
    if share < MIN_RECOLOUR_SHARE:
        return logo.copy(), share
    out = Image.composite(Image.new("RGB", logo.size, WHITE), rgb, weight)
    out.putalpha(logo.getchannel("A"))
    return out, share


# --------------------------------------------------------------------------------------
# Analysis
# --------------------------------------------------------------------------------------
def dominant_colours(im: Image.Image, k: int = 5, max_side: int | None = 256) -> list[dict]:
    """Top-k colours of the solid pixels (median cut), near-duplicates (dE < 5) merged."""
    small = im.copy()
    if max_side:
        small.thumbnail((max_side, max_side), Image.Resampling.NEAREST)  # nearest: no blended colours
    raw = small.convert("RGBA").tobytes()
    px = bytearray()
    for i in range(0, len(raw), 4):
        if raw[i + 3] >= ALPHA_OPAQUE:
            px += raw[i:i + 3]
    n = len(px) // 3
    if n == 0:
        return []
    tmp = Image.frombytes("RGB", (n, 1), bytes(px))
    q = tmp.quantize(colors=8, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()
    merged: list[list] = []  # [count, rgb]
    for count, idx in sorted(q.getcolors(), reverse=True):
        rgb = tuple(pal[idx * 3: idx * 3 + 3])
        for m in merged:
            if delta_e76(m[1], rgb) < 5:
                m[0] += count
                break
        else:
            merged.append([count, rgb])
    out = []
    for count, rgb in sorted(merged, key=lambda m: -m[0])[:k]:
        token, de = nearest_token(rgb)
        out.append({
            "hex": rgb_to_hex(rgb),
            "share": round(count / n, 4),
            "nearest_token": token,
            "nearest_token_hex": BRAND_TOKENS[token],
            "delta_e76": round(de, 2),
        })
    return out


def edge_pixels(im: Image.Image) -> Image.Image:
    """Keep only solid pixels that touch transparency: the colours that actually meet the
    page background. Inner details (e.g. a letter drawn on the gold mark) are excluded."""
    alpha = im.getchannel("A")
    solid = alpha.point(lambda v: 255 if v >= ALPHA_OPAQUE else 0)
    near_clear = alpha.point(lambda v: 255 if v < ALPHA_OPAQUE else 0).filter(ImageFilter.MaxFilter(5))
    edge = ImageChops.multiply(solid, near_clear)
    out = im.copy()
    out.putalpha(edge)
    return out


def contrast_check(im: Image.Image, background, label: str, warnings: list[str]) -> list[dict]:
    """WCAG contrast of the colours on the logo's outline against the page background."""
    rows = []
    for c in dominant_colours(edge_pixels(im), k=5, max_side=None):
        if c["share"] < MIN_EDGE_SHARE:
            continue
        ratio = contrast_ratio(hex_to_rgb(c["hex"]), background)
        row = {
            "hex": c["hex"],
            "share": c["share"],
            "contrast": round(ratio, 2),
            "passes_3_to_1_graphic": ratio >= WCAG_GRAPHIC_MIN,
            "passes_4_5_to_1_text": ratio >= WCAG_TEXT_MIN,
        }
        rows.append(row)
        if ratio < WCAG_GRAPHIC_MIN:
            warnings.append(
                f"{label}: outline colour {c['hex']} ({c['share']:.0%} of edge pixels) has contrast {ratio:.2f}:1 "
                f"against {rgb_to_hex(background)}; below WCAG 3:1 for graphics."
            )
    return rows


# --------------------------------------------------------------------------------------
# Main pipeline
# --------------------------------------------------------------------------------------
def save_png(im: Image.Image, path: Path, written: list[str]) -> None:
    im.save(path, format="PNG", optimize=True)
    written.append(path.name)


def run(source: Path, out: Path) -> dict:
    if not source.is_dir():
        raise BrandError(f"source folder not found: {source}")
    if out.resolve() == source.resolve():
        raise BrandError("--out must be different from --source")

    logo_files = find_source(source, "logo")
    mark_files = find_source(source, "mark")
    if not logo_files and not mark_files:
        present = [p.name for p in sorted(source.iterdir()) if p.is_file() and p.name not in (".gitkeep", "README.md")]
        hint = f" Files present: {', '.join(present)}." if present else " The folder is empty."
        raise BrandError(
            f"no logo found in {source}. Expected logo.svg / logo.png (full logo) and/or "
            f"mark.svg / mark.png (square mark).{hint} Rename the files and run again."
        )

    warnings: list[str] = []
    notes: list[str] = []
    report: dict = {"source_dir": str(source), "out_dir": str(out), "sources": {}}

    logo = mark = None
    if logo_files:
        logo_raw, report["sources"]["logo"] = load_source(logo_files, "logo", warnings)
        logo = trim(logo_raw)
    if mark_files:
        mark_raw, report["sources"]["mark"] = load_source(mark_files, "mark", warnings)
        mark = trim(mark_raw)

    mark_box = detect_mark_box(logo) if logo is not None else None
    if logo is None:
        assert mark is not None
        logo = mark
        # Mark-only mode: the app sets the "Tabital Pay" wordmark as HTML text (Poppins webfont)
        # next to the mark, so this is expected, not a problem with the inputs.
        notes.append("logo: no logo.* file; mark-only mode, logo-on-* images are the mark alone. "
                     "The app renders the \"Tabital Pay\" wordmark as HTML text.")
    if mark is None:
        if mark_box is not None:
            mark = logo.crop(mark_box)
            notes.append(f"mark: no mark.* file; mark cut from the logo at box {list(mark_box)}.")
        else:
            mark = logo
            warnings.append("mark: no mark.* file and no separate mark found in the logo; the whole logo is "
                            "used for icons (will be tiny). Please send mark.svg / mark.png.")

    out.mkdir(parents=True, exist_ok=True)
    written: list[str] = []

    # Square marks
    for s in MARK_SIZES:
        inner = s * (1 - 2 * MARK_PADDING)
        save_png(place(mark, s, inner, inner, (0, 0, 0, 0)), out / f"mark-{s}.png", written)

    # Logos
    on_navy_full, recoloured_share = recolour_for_navy(logo, mark_box)
    if recoloured_share < MIN_RECOLOUR_SHARE:
        notes.append("logo-on-navy: no dark wordmark pixels found; copied with original colours.")
    else:
        notes.append(f"logo-on-navy: {recoloured_share:.1%} of solid pixels recoloured towards white"
                     + (" (mark area kept as-is)." if mark_box else "."))
        if mark_box is None:
            warnings.append("logo-on-navy: could not locate the mark inside the logo, so dark parts of the mark "
                            "(if any) were recoloured too. Check logo-on-navy@2x.png by eye.")
    for suffix, h in LOGO_HEIGHTS.items():
        save_png(fit_height(logo, h), out / f"logo-on-white{suffix}.png", written)
        save_png(fit_height(on_navy_full, h), out / f"logo-on-navy{suffix}.png", written)

    # Favicon (exact per-size renders, not one image downscaled by the ICO writer)
    fav = {s: place(mark, s, s * (1 - 2 * MARK_PADDING), s * (1 - 2 * MARK_PADDING), (0, 0, 0, 0))
           for s in FAVICON_SIZES}
    big = max(FAVICON_SIZES)
    fav[big].save(out / "favicon.ico", format="ICO", sizes=[(s, s) for s in FAVICON_SIZES],
                  append_images=[fav[s] for s in FAVICON_SIZES if s != big])
    written.append("favicon.ico")

    # Navy-background icons (opaque)
    navy_rgba = NAVY + (255,)
    inner = APPLE_TOUCH_SIZE * (1 - 2 * APPLE_TOUCH_PADDING)
    apple = place(mark, APPLE_TOUCH_SIZE, inner, inner, navy_rgba).convert("RGB")
    save_png(apple, out / "apple-touch-icon.png", written)
    mw, mh = mark.size
    for s in MASKABLE_SIZES:
        # Fit the mark's bounding box (its diagonal) inside the 80 % safe circle.
        k = (MASKABLE_SAFE_DIAMETER * s) / math.hypot(mw, mh)
        save_png(place(mark, s, mw * k, mh * k, navy_rgba).convert("RGB"), out / f"icon-{s}.png", written)

    # Analysis
    report["dominant_colours"] = {
        "logo": dominant_colours(logo) if "logo" in report["sources"] else [],
        "mark": dominant_colours(mark),
    }
    for label, cols in report["dominant_colours"].items():
        for c in cols:
            if c["share"] >= MIN_SHARE_FOR_CHECKS and c["delta_e76"] > DRIFT_DELTA_E:
                warnings.append(
                    f"{label}: colour {c['hex']} ({c['share']:.0%}) is {c['delta_e76']:.1f} delta E from the nearest "
                    f"brand token {c['nearest_token']} {c['nearest_token_hex']} (> {DRIFT_DELTA_E:g}); check for colour drift."
                )
    report["contrast"] = {
        "logo_on_navy_vs_#02163f": contrast_check(fit_height(on_navy_full, 192), NAVY, "logo-on-navy", warnings),
        "logo_on_white_vs_#ffffff": contrast_check(fit_height(logo, 192), WHITE, "logo-on-white", warnings),
        "mark_on_navy_icons_vs_#02163f": contrast_check(place(mark, 256, 256, 256, (0, 0, 0, 0)), NAVY, "navy icons (mark)", warnings),
    }
    report["mark_box_in_logo"] = list(mark_box) if mark_box else None
    report["on_navy_recoloured_share"] = round(recoloured_share, 4)
    report["outputs"] = sorted(written) + ["report.json"]
    report["notes"] = notes
    report["warnings"] = warnings

    (out / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def print_summary(report: dict) -> None:
    print("Tabital Pay logo pipeline")
    print(f"  source: {report['source_dir']}")
    for label, meta in report["sources"].items():
        print(f"    {label}: {meta['file']} {meta['size'][0]}x{meta['size'][1]} "
              f"{'transparent' if meta['has_transparency'] else 'OPAQUE'}")
    print(f"  output: {report['out_dir']}")
    print(f"    {', '.join(report['outputs'])}")
    for label, cols in report["dominant_colours"].items():
        if not cols:
            continue
        print(f"  dominant colours ({label}):")
        for c in cols:
            print(f"    {c['hex']}  {c['share']:6.1%}  -> {c['nearest_token']:<14} {c['nearest_token_hex']}  dE {c['delta_e76']:.1f}")
    print("  contrast (WCAG):")
    for label, rows in report["contrast"].items():
        parts = [f"{r['hex']} {r['contrast']:.2f}:1{'' if r['passes_3_to_1_graphic'] else ' FAIL'}" for r in rows]
        print(f"    {label}: {', '.join(parts) or '-'}")
    for n in report["notes"]:
        print(f"  note: {n}")
    if report["warnings"]:
        print(f"  {len(report['warnings'])} warning(s):")
        for w in report["warnings"]:
            print(f"    ! {w}")
    else:
        print("  no warnings")


def main(argv: list[str] | None = None) -> int:
    here = Path(__file__).resolve().parent
    ap = argparse.ArgumentParser(description="Build Tabital Pay logo/icon assets from brand/source/.")
    ap.add_argument("--source", type=Path, default=here / "source", help="folder with logo.* / mark.* (default: brand/source)")
    ap.add_argument("--out", type=Path, default=here.parent / "src" / "assets" / "brand",
                    help="output folder (default: src/assets/brand)")
    args = ap.parse_args(argv)
    try:
        report = run(args.source, args.out)
    except BrandError as exc:
        sys.stderr.write(f"ERROR: {exc}\n")
        return EXIT_INPUT_ERROR
    print_summary(report)
    return 0


if __name__ == "__main__":
    sys.exit(main())
