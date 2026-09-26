import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';

/**
 * Merchant settlement batches (Phase 5). Batches are made on each merchant's 3/7/30-day cycle
 * from delivered sales minus clawbacks. Every batch is checked and approved here, then paid by
 * Paystack transfer.
 */
@Component({
  selector: 'app-settlements',
  templateUrl: './settlements.component.html',
  styleUrls: ['./settlements.component.scss']
})
export class SettlementsComponent implements OnInit {
  readonly filters = [
    { value: 'pending_approval', label: 'Awaiting approval' },
    { value: 'on_hold', label: 'On hold' },
    { value: 'processing', label: 'Sending' },
    { value: 'failed', label: 'Failed' },
    { value: 'paid', label: 'Paid' },
    { value: '', label: 'All' }
  ];
  status = 'pending_approval';
  batches: any[] = [];
  isLoading = false;
  message = '';
  error = '';

  selected: any = null;
  approving = false;
  generating = false;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.isLoading = true;
    this.adminService.getSettlementBatches(this.status).subscribe({
      next: (res: any) => { this.batches = res.settlements || []; this.isLoading = false; },
      error: (err: any) => { this.isLoading = false; this.error = err.error?.error || 'Could not load settlements'; }
    });
  }

  setFilter(value: string) {
    this.status = value;
    this.load();
  }

  get totalNet(): number {
    return this.batches.reduce((sum, b) => sum + (b.net || 0), 0);
  }

  generate() {
    this.generating = true;
    this.clear();
    this.adminService.generateSettlementBatches().subscribe({
      next: (res: any) => {
        this.generating = false;
        const n = (res.created || []).length;
        this.message = n ? `${n} new settlement batch(es) created.` : 'No merchant cycles have ended with money owed.';
        this.load();
      },
      error: (err: any) => { this.generating = false; this.error = err.error?.error || 'Could not create batches'; }
    });
  }

  open(batch: any) {
    this.clear();
    this.adminService.getSettlementBatch(batch.id).subscribe({
      next: (res: any) => { this.selected = res; },
      error: (err: any) => { this.error = err.error?.error || 'Could not open this settlement'; }
    });
  }

  canApprove(batch: any): boolean {
    return ['pending_approval', 'on_hold', 'failed'].includes(batch?.status);
  }

  approve(batch: any) {
    const acct = batch.payout_account;
    const dest = acct?.payout_method === 'bank'
      ? `${acct.bank_name || 'bank'} account ${acct.account_number}`
      : `Mobile Money ${acct?.momo_number}`;
    if (!confirm(`Send ${this.formatCurrency(batch.net)} to ${batch.merchant_name} (${dest})?\n\nThis starts a real Paystack transfer.`)) return;
    this.approving = true;
    this.clear();
    this.adminService.approveSettlementBatch(batch.id).subscribe({
      next: (res: any) => {
        this.approving = false;
        this.message = res.message;
        this.selected = null;
        this.load();
      },
      error: (err: any) => {
        this.approving = false;
        this.error = err.error?.message || err.error?.error || 'Approval failed';
        if (err.error?.settlement) this.selected = { ...this.selected, ...err.error.settlement };
        this.load();
      }
    });
  }

  statusLabel(status: string): string {
    return this.filters.find(f => f.value === status)?.label || status;
  }

  statusClass(status: string): string {
    return ({ paid: 'status-paid', processing: 'status-processing', failed: 'status-failed' } as any)[status] || 'status-pending';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount || 0);
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private clear() {
    this.message = '';
    this.error = '';
  }
}
