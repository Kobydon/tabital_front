import { Directive, Injectable, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subscription } from 'rxjs';

import { environment } from 'src/environments/environment';

/**
 * Management Access (founder, 2026-09-27): approvals, rates, settings, reveals and exports are for
 * management only. The server enforces it on every request (tabital/app/services/access.py); this
 * only hides what an operations admin would be refused. Until the level is known, it's treated as
 * operations (the safe default).
 */
@Injectable({ providedIn: 'root' })
export class AdminAccess {
  private readonly level$ = new BehaviorSubject<'management' | 'operations' | null>(null);
  private loading = false;

  readonly changes = this.level$.asObservable();

  constructor(private http: HttpClient) {}

  get isManagement(): boolean {
    return this.level$.value === 'management';
  }

  get level(): string | null {
    return this.level$.value;
  }

  /** Ask the server once per page load (and again after sign-in). */
  load(force = false): void {
    if (this.loading || (!force && this.level$.value !== null)) return;
    this.loading = true;
    this.http.get<{ role?: string; admin_level?: string | null }>(`${environment.apiUrl}/admin/get_current_user`).subscribe({
      next: me => {
        this.loading = false;
        this.level$.next(me?.role === 'admin' && me.admin_level === 'management' ? 'management' : 'operations');
      },
      error: () => { this.loading = false; this.level$.next('operations'); }
    });
  }
}

/** <button *tpManagement ...>Approve</button>: shown only to admins with Management Access. */
@Directive({ selector: '[tpManagement]' })
export class TpManagementDirective implements OnInit, OnDestroy {
  private shown = false;
  private sub?: Subscription;

  constructor(private tpl: TemplateRef<unknown>, private vcr: ViewContainerRef, private access: AdminAccess) {}

  ngOnInit(): void {
    this.access.load();
    this.sub = this.access.changes.subscribe(() => {
      const show = this.access.isManagement;
      if (show && !this.shown) this.vcr.createEmbeddedView(this.tpl);
      if (!show && this.shown) this.vcr.clear();
      this.shown = show;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
