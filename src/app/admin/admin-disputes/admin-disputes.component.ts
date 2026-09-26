import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';

import { notify } from 'src/app/shared/notify';
import { ask } from 'src/app/ui/confirm';
/**
 * Buyer-protection disputes (Phase 4). Opening a dispute pauses the plan; resolving it
 * either resumes payments (merchant won, due dates moved forward by the pause) or writes off
 * the rest of the balance (customer won) and shows the refund due.
 */
@Component({
  selector: 'app-admin-disputes',
  templateUrl: './admin-disputes.component.html',
  styleUrls: ['./admin-disputes.component.scss']
})
export class AdminDisputesComponent implements OnInit {
  disputes: any[] = [];
  statusFilter = 'open';
  isLoading = true;
  selected: any = null;
  outcome: 'merchant_won' | 'customer_won' = 'merchant_won';
  notes = '';
  isSubmitting = false;
  isRunningServicing = false;
  servicingSummary: any = null;

  readonly reasonLabels: Record<string, string> = {
    product_not_received: 'Item not received',
    defective: 'Faulty or damaged',
    not_as_described: 'Not as described',
    unauthorized: 'Unauthorized purchase',
    other: 'Other'
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.adminService.getDisputes(this.statusFilter).subscribe({
      next: (res: any) => {
        this.disputes = res?.disputes || [];
        this.isLoading = false;
      },
      error: () => {
        this.disputes = [];
        this.isLoading = false;
      }
    });
  }

  open(dispute: any): void {
    this.selected = dispute;
    this.outcome = 'merchant_won';
    this.notes = '';
  }

  async resolve(): Promise<void> {
    if (!this.selected || this.notes.trim().length < 5) return;
    const summary = this.outcome === 'customer_won'
      ? 'Resolve for the CUSTOMER? The remaining balance will be written off and the plan cancelled.'
      : 'Resolve for the MERCHANT? Payments resume with due dates moved forward by the pause.';
    if (!(await ask(summary))) return;
    this.isSubmitting = true;
    this.adminService.resolveDispute(this.selected.id, { outcome: this.outcome, notes: this.notes.trim() }).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        notify(res?.message || 'Dispute resolved');
        this.selected = null;
        this.load();
      },
      error: (error) => {
        this.isSubmitting = false;
        notify(error?.error?.error || 'Could not resolve the dispute', 'error');
      }
    });
  }

  async runServicing(): Promise<void> {
    if (!(await ask('Run today\'s servicing now (late fees, overdue buckets, reminders, autopay)? It is safe to run more than once a day.'))) return;
    this.isRunningServicing = true;
    this.adminService.runServicing().subscribe({
      next: (res: any) => {
        this.isRunningServicing = false;
        this.servicingSummary = res?.summary;
      },
      error: (error) => {
        this.isRunningServicing = false;
        notify(error?.error?.error || 'Servicing run failed', 'error');
      }
    });
  }

  isOverdue(d: any): boolean {
    return d.status !== 'resolved' && d.respond_by && new Date(d.respond_by) < new Date();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', currencyDisplay: 'code' }).format(amount || 0);
  }
}
