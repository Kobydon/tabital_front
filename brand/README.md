# Tabital Pay brand assets

One command turns the founder's original logo into every logo and icon the web app needs.
Nothing is downloaded: the script only reads `brand/source/` and writes `src/assets/brand/`.

## 1. Get the source files

The founder drops the files into `brand/source/` (see `source/README.md`):
`logo.svg|png` (mark + "Tabital Pay" wordmark) and ideally `mark.svg|png` (the mark alone).
SVG is preferred; otherwise PNG >= 1024 px with a transparent background.

## 2. Run it (Windows, from the project root `Tabital APP  Review by Claude Code`)

The existing backend venv (`tabital\.venv`, Python 3.12) works:

```powershell
tabital\.venv\Scripts\python.exe -m pip install -r tabital_front\brand\requirements.txt
tabital\.venv\Scripts\python.exe tabital_front\brand\prepare_logo.py
```

Options: `--source DIR` (default `tabital_front/brand/source`), `--out DIR` (default
`tabital_front/src/assets/brand`). Re-running is safe: it overwrites the same files with identical
bytes. Exit code `2` means a problem with the inputs (the message says what to fix).

**SVG input** needs `cairosvg` (commented out in `requirements.txt`), which on Windows also needs
the native Cairo library. If it isn't available and a PNG with the same name is in the folder,
the PNG is used; otherwise the script stops and asks for a PNG export.

Read the printed summary (also saved as `report.json`) before wiring anything in.

## 3. Outputs (`src/assets/brand/`)

| File | Size | Use |
|---|---|---|
| `mark-32.png`, `mark-64.png`, `mark-128.png`, `mark-256.png` | square, transparent, ~8 % padding | Replaces the `.logo-icon.tp-mark-box` stand-in; loaders, avatars, emails |
| `logo-on-white@1x.png`, `logo-on-white@2x.png` | 48 / 96 px high | Full logo on white/light pages (login card, receipts), original colours |
| `logo-on-navy@1x.png`, `logo-on-navy@2x.png` | 48 / 96 px high | Full logo on navy `#02163f` (sidebars of the three shells). Gold/ochre kept, dark wordmark recoloured to white |
| `favicon.ico` | 16, 32, 48 | Browser tab |
| `apple-touch-icon.png` | 180, opaque navy | iOS home screen |
| `icon-192.png`, `icon-512.png` | opaque navy, maskable | PWA / Android; mark inside the 80 % safe circle |
| `report.json` | - | Dominant colours, nearest brand token and delta E, WCAG contrast, warnings |

### How the on-navy version is made
Each pixel gets a weight from its luminance (dark = 1) times "not gold" (from R - B: ochre/gold
= 0). The pixel is blended towards white by that weight and its alpha is left alone, so
anti-aliased edges stay smooth. The mark (detected as the first block separated from the
wordmark by a clear gap) is never recoloured. If there are no dark pixels, the logo is copied as-is.

### Warnings to take seriously
- source smaller than 512 px, mark not square, no transparency: ask the founder for a better file.
- colour drift (delta E > 10 from every brand token): the file may be an old or re-exported version.
- contrast below 3:1 (WCAG 1.4.11, checked on the logo's outline colours only). Note that the
  published ochre `#c69435` on white is only about 2.7:1, so `logo-on-white` will warn if the mark
  is ochre. That is a brand decision for the founder, not a script bug.

## 4. Wiring it in (for the lead developer, not applied yet)

`angular.json` already copies `src/assets`, so everything under `assets/brand/` is served.

### `src/index.html` (`<head>`, replacing the current `favicon.ico` link)

```html
<link rel="icon" type="image/x-icon" href="assets/brand/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="assets/brand/mark-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="assets/brand/apple-touch-icon.png">
<link rel="manifest" href="assets/brand/manifest.webmanifest">
<meta name="theme-color" content="#02163f">
```

### `src/assets/brand/manifest.webmanifest` (create by hand; not generated)

```json
{
  "name": "Tabital Pay",
  "short_name": "Tabital Pay",
  "description": "Own It Today. Pay Later.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#02163f",
  "theme_color": "#02163f",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```
Icon paths in a manifest are relative to the manifest file, hence no `assets/brand/` prefix.
If the app is served under a sub-path, adjust `start_url`/`scope` to the `<base href>`.

### Shell sidebars (navy), replacing the `.logo-icon.tp-mark-box` + text block

```html
<img class="brand-logo"
     src="assets/brand/logo-on-navy@1x.png"
     srcset="assets/brand/logo-on-navy@1x.png 1x, assets/brand/logo-on-navy@2x.png 2x"
     height="48" alt="Tabital Pay">
```

Collapsed sidebar (mark only):

```html
<img src="assets/brand/mark-64.png"
     srcset="assets/brand/mark-64.png 1x, assets/brand/mark-128.png 2x"
     width="32" height="32" alt="Tabital Pay">
```

### Login page (white card)

```html
<img src="assets/brand/logo-on-white@1x.png"
     srcset="assets/brand/logo-on-white@1x.png 1x, assets/brand/logo-on-white@2x.png 2x"
     height="48" alt="Tabital Pay">
```

Set `height` only and let the width follow; the logo PNGs are cropped tight with no padding.
