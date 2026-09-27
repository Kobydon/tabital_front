import { AfterViewChecked, Component, ElementRef, HostListener, ViewChild } from '@angular/core';

/**
 * In-page confirmation dialog, replacing the browser's confirm().
 *
 *   if (!(await ask({ title: 'Cancel this link?', message: '…', confirm: 'Cancel link', danger: true }))) return;
 *
 * <tp-confirm-host> (in AppComponent) renders it. Esc or the backdrop cancels.
 */
export interface AskOptions {
  title?: string;
  message: string;
  confirm?: string;
  cancel?: string;
  danger?: boolean;
}

interface Pending extends AskOptions { resolve: (ok: boolean) => void; }

let host: TpConfirmHostComponent | null = null;

export function ask(options: AskOptions | string): Promise<boolean> {
  const opts: AskOptions = typeof options === 'string' ? { message: options } : options;
  if (!host) return Promise.resolve(window.confirm(opts.message));   // before the app has started
  return host.open(opts);
}

@Component({
  selector: 'tp-confirm-host',
  template: `
    <div class="tp-dialog-backdrop" *ngIf="current" (click)="close(false)">
      <div class="tp-dialog" role="alertdialog" aria-modal="true" aria-labelledby="tp-dialog-title"
           aria-describedby="tp-dialog-text" (click)="$event.stopPropagation()" #dialog>
        <h2 id="tp-dialog-title">{{ current.title || 'Are you sure?' }}</h2>
        <p id="tp-dialog-text">{{ current.message }}</p>
        <div class="tp-dialog__actions">
          <button tpButton="ghost" type="button" (click)="close(false)">{{ current.cancel || 'Cancel' }}</button>
          <button [tpButton]="current.danger ? 'danger' : 'navy'" type="button" (click)="close(true)" #confirmBtn>
            {{ current.confirm || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>`
})
export class TpConfirmHostComponent implements AfterViewChecked {
  current: Pending | null = null;
  private queue: Pending[] = [];
  private focusPending = false;
  private lastFocus: HTMLElement | null = null;
  @ViewChild('confirmBtn') confirmBtn?: ElementRef<HTMLButtonElement>;

  constructor() {
    host = this;
  }

  open(opts: AskOptions): Promise<boolean> {
    return new Promise(resolve => {
      this.queue.push({ ...opts, resolve });
      if (!this.current) this.next();
    });
  }

  private next() {
    this.current = this.queue.shift() || null;
    if (this.current) {
      this.lastFocus = document.activeElement as HTMLElement;
      this.focusPending = true;
    }
  }

  ngAfterViewChecked(): void {
    if (this.focusPending && this.confirmBtn) {
      this.focusPending = false;
      this.confirmBtn.nativeElement.focus();
    }
  }

  close(ok: boolean) {
    const done = this.current;
    this.current = null;
    done?.resolve(ok);
    this.lastFocus?.focus?.();
    this.next();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.current) this.close(false);
  }
}
