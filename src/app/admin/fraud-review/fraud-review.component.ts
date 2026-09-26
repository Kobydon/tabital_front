import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';

/** Fraud signals (CLAUDE.md §9D/E). "block" stops purchases, order approval and payouts until reviewed. */
@Component({
  selector: 'app-fraud-review',
  templateUrl: './fraud-review.component.html',
  styleUrls: ['../settlements/settlements.component.scss']
})
export class FraudReviewComponent implements OnInit {
  readonly statuses = [
    { value: 'open', label: 'Open' },
    { value: 'confirmed', label: 'Confirmed fraud' },
    { value: 'cleared', label: 'Cleared' },
    { value: '', label: 'All' }
  ];
  status = 'open';
  severity = '';
  signals: any[] = [];
  counts: any = {};
  isLoading = false;
  selected: any = null;
  note = '';
  busy = false;
  message = '';
  error = '';

  readonly labels: Record<string, string> = {
    duplicate_ghana_card: 'Duplicate Ghana Card',
    self_dealing: 'Customer buying from own shop',
    shared_device: 'Shared device',
    merchant_customer_same_device: 'Merchant and customer on one device',
    automated_browser: 'Automated browser / emulator',
    shared_momo: 'Shared MoMo number',
    merchant_customer_shared_account: 'Customer and merchant share an account',
    shared_payout_account: 'Merchants share a payout account',
    repeat_orders_same_customer: 'Repeat orders, same customer',
    quick_dispute: 'Dispute right after delivery'
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.isLoading = true;
    this.adminService.getFraudSignals({ status: this.status, severity: this.severity || undefined }).subscribe({
      next: (res: any) => {
        this.signals = res.signals || [];
        this.counts = res.open_counts || {};
        this.isLoading = false;
      },
      error: (err: any) => { this.isLoading = false; this.error = err.error?.error || 'Could not load signals'; }
    });
  }

  setStatus(value: string) { this.status = value; this.load(); }
  setSeverity(value: string) { this.severity = value; this.load(); }

  open(signal: any) {
    this.selected = signal;
    this.note = '';
    this.error = '';
  }

  review(status: 'cleared' | 'confirmed') {
    if (!this.selected || this.note.trim().length < 5) {
      this.error = 'Add a note explaining the decision (at least 5 characters).';
      return;
    }
    this.busy = true;
    this.adminService.reviewFraudSignal(this.selected.id, status, this.note.trim()).subscribe({
      next: () => {
        this.busy = false;
        this.message = status === 'cleared' ? 'Signal cleared.' : 'Marked as fraud. The block stays in place.';
        this.selected = null;
        this.load();
      },
      error: (err: any) => { this.busy = false; this.error = err.error?.error || 'Could not save'; }
    });
  }

  label(code: string): string {
    return this.labels[code] || code;
  }

  who(u: any): string {
    if (!u) return '—';
    return `${u.name || 'Unnamed'} (${u.role}, ${u.phone})`;
  }

  severityClass(sev: string): string {
    return ({ block: 'status-failed', review: 'status-pending', info: 'status-processing' } as any)[sev] || '';
  }

  detailsList(details: any): { key: string; value: string }[] {
    return Object.entries(details || {}).filter(([k]) => k !== 'history')
      .map(([key, value]) => ({ key, value: Array.isArray(value) ? value.join(', ') : String(value) }));
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
