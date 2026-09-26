import { Component, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { notify } from '../shared/notify';
import { AdminAccess } from './admin-access';

/**
 * A personal value that admin screens get masked (Ghana Card, phone, MoMo, account numbers).
 * The full value needs a reason and every reveal is logged on the server (POST /admin/pii/reveal).
 * Only admins with Management Access see the Reveal button (the server refuses anyone else).
 *
 * <tp-reveal [userId]="c.id" field="national_id" [value]="c.national_id"></tp-reveal>
 */
@Component({
  selector: 'tp-reveal',
  template: `
    <span class="tp-reveal">
      <span class="tp-reveal__value" [class.tp-reveal__value--shown]="revealed !== null">{{ (revealed ?? value) || '—' }}</span>
      <ng-container *ngIf="value && userId && revealed === null && access.isManagement">
        <button *ngIf="!asking" type="button" class="tp-reveal__btn" (click)="asking = true"
                [attr.aria-label]="'Reveal ' + label">
          <lucide-icon name="eye" [size]="14"></lucide-icon> Reveal
        </button>
        <form *ngIf="asking" class="tp-reveal__form" (ngSubmit)="reveal()">
          <input [id]="inputId" class="tp-input tp-input--sm" [(ngModel)]="reason" name="reason" required minlength="5"
                 maxlength="300" placeholder="Why do you need it? (logged)" [attr.aria-label]="'Reason to reveal ' + label">
          <button tpButton="secondary" size="sm" type="submit" [disabled]="busy || reason.trim().length < 5">Show</button>
          <button tpButton="ghost" size="sm" type="button" (click)="cancel()">Cancel</button>
        </form>
      </ng-container>
      <button *ngIf="revealed !== null" type="button" class="tp-reveal__btn" (click)="hide()"
              [attr.aria-label]="'Hide ' + label">
        <lucide-icon name="eye-off" [size]="14"></lucide-icon> Hide
      </button>
    </span>`
})
export class TpRevealComponent {
  private static seq = 0;

  @Input() userId: number | null | undefined = null;
  @Input() field = 'national_id';
  @Input() value: string | null = null;     // the masked value from the admin API
  @Input() label = 'this value';

  inputId = `tp-reveal-${++TpRevealComponent.seq}`;
  asking = false;
  busy = false;
  reason = '';
  revealed: string | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private http: HttpClient, public access: AdminAccess) {
    access.load();
  }

  reveal(): void {
    if (this.reason.trim().length < 5 || !this.userId) return;
    this.busy = true;
    this.http.post<{ value: string | null }>(`${environment.apiUrl}/admin/pii/reveal`,
      { user_id: this.userId, field: this.field, reason: this.reason.trim() }).subscribe({
      next: res => {
        this.busy = false;
        this.asking = false;
        this.reason = '';
        this.revealed = res.value ?? '';
        // Don't leave personal data on screen: hide again after a minute
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => this.hide(), 60000);
      },
      error: err => {
        this.busy = false;
        notify(err?.error?.error || 'Could not reveal this value', 'error');
      }
    });
  }

  hide(): void {
    this.revealed = null;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  cancel(): void {
    this.asking = false;
    this.reason = '';
  }
}
