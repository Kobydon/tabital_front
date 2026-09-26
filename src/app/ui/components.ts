import { Component, Directive, EventEmitter, HostBinding, Input, Output } from '@angular/core';

/* ---------------------------------------------------------------- button */

/**
 * <button tpButton>Pay</button> (primary: gold, the one main action)
 * <button tpButton="secondary" size="sm" [loading]="saving">Save</button>
 */
@Directive({ selector: 'button[tpButton], a[tpButton]' })
export class TpButtonDirective {
  @Input() tpButton: 'primary' | 'secondary' | 'navy' | 'ghost' | 'danger' | 'on-navy' | '' = 'primary';
  @Input() size: 'md' | 'sm' = 'md';
  @Input() block = false;
  @Input() loading = false;

  @HostBinding('class') get classes(): string {
    return ['tp-btn', `tp-btn--${this.tpButton || 'primary'}`, this.size === 'sm' ? 'tp-btn--sm' : '',
      this.block ? 'tp-btn--block' : ''].filter(Boolean).join(' ');
  }
  @HostBinding('attr.aria-busy') get busy(): string | null { return this.loading ? 'true' : null; }
  @HostBinding('disabled') @Input() disabled = false;
}

/* ---------------------------------------------------------------- field */

/**
 * <tp-field label="Monthly salary" for="salary" hint="Before tax" [error]="err">
 *   <input id="salary" ...>
 * </tp-field>
 * The control keeps its own id; `for` links the label to it.
 */
@Component({
  selector: 'tp-field',
  template: `
    <div class="tp-field" [class.tp-field--invalid]="!!error">
      <label class="tp-field__label" [attr.for]="for">{{ label }}<span *ngIf="required" class="tp-field__req" aria-hidden="true">*</span></label>
      <ng-content></ng-content>
      <span *ngIf="hint && !error" class="tp-field__hint" [id]="for ? for + '-hint' : null">{{ hint }}</span>
      <span *ngIf="error" class="tp-field__error" role="alert" [id]="for ? for + '-error' : null">{{ error }}</span>
    </div>`
})
export class TpFieldComponent {
  @Input() label = '';
  @Input() for = '';
  @Input() hint = '';
  @Input() error: string | null = null;
  @Input() required = false;
}

/* ---------------------------------------------------------------- card */

/** <tp-card title="Schedule" subtitle="0% interest"> ... <div card-actions>..</div> <div card-footer>..</div> </tp-card> */
@Component({
  selector: 'tp-card',
  template: `
    <section class="tp-card">
      <header class="tp-card__head" *ngIf="title || subtitle">
        <div><h2 class="tp-card__title" *ngIf="title">{{ title }}</h2><p class="tp-card__sub" *ngIf="subtitle">{{ subtitle }}</p></div>
        <div class="tp-card__actions"><ng-content select="[card-actions]"></ng-content></div>
      </header>
      <div class="tp-card__body"><ng-content></ng-content></div>
      <ng-content select="[card-footer]"></ng-content>
    </section>`
})
export class TpCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
}

/* ---------------------------------------------------------------- status chip */

const TONES: Record<string, { tone: string; label: string }> = {
  paid: { tone: 'success', label: 'Paid' }, completed: { tone: 'success', label: 'Completed' },
  approved: { tone: 'success', label: 'Approved' }, clear: { tone: 'success', label: 'Verified' },
  verified: { tone: 'success', label: 'Verified' }, active: { tone: 'info', label: 'Active' },
  pending: { tone: 'warn', label: 'Pending' }, due: { tone: 'warn', label: 'Due' },
  pending_approval: { tone: 'warn', label: 'Awaiting approval' }, awaiting_payment: { tone: 'warn', label: 'Awaiting down payment' },
  review: { tone: 'warn', label: 'In review' }, on_hold: { tone: 'warn', label: 'On hold' },
  processing: { tone: 'info', label: 'Processing' }, upcoming: { tone: 'info', label: 'Upcoming' },
  overdue: { tone: 'error', label: 'Overdue' }, failed: { tone: 'error', label: 'Failed' },
  rejected: { tone: 'error', label: 'Rejected' }, blocked: { tone: 'error', label: 'Blocked' },
  defaulted: { tone: 'error', label: 'Defaulted' }, cancelled: { tone: 'neutral', label: 'Cancelled' },
};

/** A status as a word and a colour (never colour alone): <tp-chip status="overdue"></tp-chip> */
@Component({
  selector: 'tp-chip',
  template: `<span class="tp-chip tp-chip--{{ resolvedTone }}"><ng-content></ng-content>{{ text }}</span>`
})
export class TpChipComponent {
  @Input() status = '';
  @Input() tone: '' | 'success' | 'warn' | 'error' | 'info' | 'neutral' = '';
  @Input() label = '';

  get resolvedTone(): string {
    return this.tone || TONES[this.status]?.tone || 'neutral';
  }

  get text(): string {
    if (this.label) return this.label;
    const known = TONES[this.status];
    if (known) return known.label;
    const s = (this.status || '').replace(/_/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

/* ---------------------------------------------------------------- page header, empty state */

@Component({
  selector: 'tp-page-header',
  template: `
    <header class="tp-page-header">
      <div class="tp-page-header__text"><h1>{{ title }}</h1><p *ngIf="subtitle">{{ subtitle }}</p></div>
      <div class="tp-page-header__actions"><ng-content></ng-content></div>
    </header>`
})
export class TpPageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
}

@Component({
  selector: 'tp-empty-state',
  template: `
    <div class="tp-empty">
      <div class="tp-empty__icon" *ngIf="icon"><lucide-icon [name]="icon" [size]="32"></lucide-icon></div>
      <h3>{{ title }}</h3>
      <p *ngIf="text">{{ text }}</p>
      <ng-content></ng-content>
    </div>`
})
export class TpEmptyStateComponent {
  @Input() icon = '';
  @Input() title = '';
  @Input() text = '';
}

/* ---------------------------------------------------------------- next payment card (from Concept B) */

/**
 * The customer's next payment, first thing on their screens:
 * <tp-next-payment [amount]="880" [instalment]="800" [lateFee]="80" dueDate="2026-10-26"
 *   [paid]="1" [total]="4" [deferFee]="80" (pay)="..." (defer)="..."></tp-next-payment>
 */
@Component({
  selector: 'tp-next-payment',
  template: `
    <section class="tp-next" [class.tp-next--overdue]="overdue" aria-labelledby="tp-next-label">
      <div class="tp-next__label" id="tp-next-label">{{ overdue ? 'Overdue payment' : 'Next payment' }}<ng-container *ngIf="productName"> · {{ productName }}</ng-container></div>
      <div class="tp-next__amount">{{ amount | money }}</div>
      <div class="tp-next__due">{{ overdue ? 'Was due' : 'Due' }} {{ dueDate | tpDate }}<ng-container *ngIf="daysText"> · {{ daysText }}</ng-container></div>
      <div class="tp-next__fee" *ngIf="lateFee > 0">{{ instalment | money }} + {{ lateFee | money }} late fee</div>
      <ng-container *ngIf="total > 0">
        <div class="tp-next__bar" role="progressbar" [attr.aria-valuenow]="paid" aria-valuemin="0" [attr.aria-valuemax]="total"
             [attr.aria-label]="paid + ' of ' + total + ' payments made'"><i [style.width.%]="paid / total * 100"></i></div>
        <div class="tp-next__progress">{{ paid }} of {{ total }} payments made</div>
      </ng-container>
      <div class="tp-next__actions">
        <button tpButton type="button" (click)="pay.emit()" [disabled]="busy">
          <lucide-icon name="lock" [size]="16"></lucide-icon> Pay {{ amount | money }}
        </button>
        <button *ngIf="canDefer" tpButton="on-navy" type="button" (click)="defer.emit()">
          <lucide-icon name="calendar-plus" [size]="16"></lucide-icon>
          Defer<ng-container *ngIf="deferFee !== null"> ({{ deferFee | money }})</ng-container>
        </button>
      </div>
    </section>`
})
export class TpNextPaymentComponent {
  @Input() amount: number | null = null;       // total due now (instalment + late fee)
  @Input() instalment: number | null = null;
  @Input() lateFee = 0;
  @Input() dueDate: string | null = null;
  @Input() paid = 0;
  @Input() total = 0;
  @Input() productName = '';
  @Input() canDefer = false;                   // show the Defer button (the server decides if it's allowed)
  @Input() deferFee: number | null = null;     // shown on the button when known
  @Input() busy = false;
  @Output() pay = new EventEmitter<void>();
  @Output() defer = new EventEmitter<void>();

  get days(): number | null {
    if (!this.dueDate) return null;
    const due = new Date(this.dueDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - today.getTime()) / 86400000);
  }

  get overdue(): boolean {
    const d = this.days;
    return d !== null && d < 0;
  }

  get daysText(): string {
    const d = this.days;
    if (d === null) return '';
    if (d === 0) return 'today';
    if (d === 1) return 'tomorrow';
    if (d > 1) return `in ${d} days`;
    return `${-d} day${d === -1 ? '' : 's'} ago`;
  }
}

/* ---------------------------------------------------------------- sticky pay bar (from Concept B) */

/** Fixed to the bottom of the screen on customer pages: <tp-pay-bar label="Due today" [amount]="1650" action="Pay now" (act)="..."> */
@Component({
  selector: 'tp-pay-bar',
  template: `
    <div class="tp-paybar-spacer" aria-hidden="true"></div>
    <div class="tp-paybar" role="region" aria-label="Payment">
      <div class="tp-paybar__text">
        <div class="tp-paybar__label">{{ label }}</div>
        <div class="tp-paybar__amount">{{ amount | money }}</div>
      </div>
      <button tpButton type="button" [disabled]="disabled || busy" [loading]="busy" (click)="act.emit()">
        <span *ngIf="busy" class="tp-spinner" aria-hidden="true"></span>
        <lucide-icon *ngIf="!busy" name="lock" [size]="16"></lucide-icon> {{ action }}
      </button>
    </div>`
})
export class TpPayBarComponent {
  @Input() label = 'Due now';
  @Input() amount: number | null = null;
  @Input() action = 'Pay now';
  @Input() disabled = false;
  @Input() busy = false;
  @Output() act = new EventEmitter<void>();
}
