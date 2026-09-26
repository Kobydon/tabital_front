# Tabital Pay UI: Vault

Concept A "Vault" was chosen by the founder on 2026-09-27. Navy frames the app, and gold marks the
single main action on a screen, always with navy text. Customer phone screens also use Concept B's
large "next payment" card and a sticky pay bar.

## Where things are

| What | File |
|---|---|
| Colour, type, space, radius and motion tokens | `src/styles/_tokens.scss` |
| Shared component styles (buttons, cards, fields, chips, dialog, next-payment, pay bar) | `src/styles/_ui.scss` |
| App shells (customer, merchant, admin) | `src/styles/_shell.scss` |
| Angular components, pipes and icons | `src/app/ui/` (`UiModule`) |

Import `UiModule` in a feature module to get everything below, plus `<lucide-icon>`.

## Building blocks

```html
<tp-page-header title="Settlements" subtitle="Paid on your 7-day cycle">
  <button tpButton size="sm">New sale</button>
</tp-page-header>

<tp-card title="Schedule" subtitle="0% interest">…</tp-card>

<tp-field label="Monthly salary" for="salary" hint="Before tax" [error]="salaryError" [required]="true">
  <input id="salary" type="number">
</tp-field>

<button tpButton>Pay GHS 800.00</button>            <!-- primary: gold, one per screen -->
<button tpButton="secondary">Download CSV</button>   <!-- navy outline -->
<button tpButton="navy" size="sm" [loading]="saving">Save</button>
<button tpButton="danger">Cancel link</button>

<tp-chip status="overdue"></tp-chip>                 <!-- word + colour, never colour alone -->
{{ amount | money }}                                 <!-- GHS 4,000.00; unknown values show "—" -->
{{ due | tpDate }}                                   <!-- 26 Sep 2026 -->
<tp-empty-state icon="package" title="No orders yet" text="…"></tp-empty-state>

<tp-next-payment [amount]="880" [instalment]="800" [lateFee]="80" dueDate="2026-10-26"
  [paid]="1" [total]="4" [canDefer]="true" (pay)="…" (defer)="…"></tp-next-payment>
<tp-pay-bar label="Due today" [amount]="1650" action="Pay now" (act)="…"></tp-pay-bar>   <!-- phones only -->
```

In code:

```ts
import { notify } from 'src/app/shared/notify';   // toast in place of alert()
import { ask } from 'src/app/ui/confirm';         // dialog in place of confirm()

notify('Saved', 'success');
if (!(await ask({ title: 'Cancel this link?', message: '…', confirm: 'Cancel link', danger: true }))) return;
```

## Rules

- **Colours:** use the tokens only; never hard-code a colour in a component. Gold is never a text
  colour on white.
- **Icons:** Lucide only (add new ones to `ui/icons.ts`). No emoji as icons.
- **Money:** always the `money` pipe (GHS code, 2 decimal places).
- **Accessibility:**
  - every input has a label (`tp-field`);
  - every action is a `<button>` or a link;
  - status always pairs a word with a colour;
  - touch targets are at least 44 px.
- **Rates in copy:** never write a rate into UI text (CLAUDE.md §12). Read it from the API
  (for example `key_facts`).
