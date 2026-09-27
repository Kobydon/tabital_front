import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';
import { AdminAccess } from 'src/app/ui/admin-access';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { notify } from 'src/app/shared/notify';

interface OverduePayment {
  id: number;
  payment_id: string;
  plan_id: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  merchant_name: string;
  installment_number: number;
  amount: number;
  late_fee: number;
  total_due: number;          // still owed, after part payments
  part_paid?: number;
  due_date: string;
  days_overdue: number;
  overdue_range: string;
  status: string;
  collection_stage: string;
}

/**
 * Collections queue (CLAUDE.md §8.4, §8.5). Due dates can't be changed here: the customer can defer
 * one instalment for the 10% fee, and any other arrangement needs a founder-approved policy.
 */
@Component({
  selector: 'app-admin-collection',
  templateUrl: './admin-collection.component.html'
})
export class AdminCollectionComponent implements OnInit {
  overduePayments: OverduePayment[] = [];
  selectedPayment: any = null;
  collectionStats: any = {};

  isLoading = true;
  showPaymentModal = false;
  showReminderModal = false;
  showMarkReceivedModal = false;
  isSubmitting = false;

  searchTerm = '';
  selectedOverdueRange = '';
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 1;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  reminderForm: FormGroup;
  markReceivedForm: FormGroup;

  // Delinquency buckets (§8.4)
  readonly overdueRangeOptions = [
    { value: '', label: 'All overdue' },
    { value: '1-30', label: '1–30 days' },
    { value: '31-60', label: '31–60 days' },
    { value: '61-90', label: '61–90 days' },
    { value: '90+', label: '90+ days' }
  ];

  // Only channels that are connected (WhatsApp isn't yet)
  readonly reminderTypeOptions = [
    { value: 'sms', label: 'SMS (mNotify)' },
    { value: 'in_app', label: 'In-app notification' }
  ];

  constructor(private adminService: AdminService, private fb: FormBuilder, public access: AdminAccess) {
    access.load();
    this.reminderForm = this.fb.group({
      reminder_type: ['sms', Validators.required]
    });
    this.markReceivedForm = this.fb.group({
      amount_received: ['', [Validators.required, Validators.min(0.01)]],
      payment_method: ['mobile_money', Validators.required],
      payment_reference: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void {
    this.loadCollectionStats();
    this.loadOverduePayments();
    this.loadClaims();
  }

  // Customers saying they paid outside the app (payment claims)
  claims: any[] = [];
  claim: any = null;
  claimAction: 'confirm' | 'reject' = 'confirm';
  claimAmount = 0;
  claimReason = '';

  loadClaims(): void {
    this.adminService.getPaymentClaims('pending').subscribe({
      next: (res: any) => { this.claims = res.claims || []; },
      error: () => { this.claims = []; }
    });
  }

  openClaim(claim: any, action: 'confirm' | 'reject'): void {
    this.claim = claim;
    this.claimAction = action;
    this.claimAmount = claim.still_owed;
    this.claimReason = '';
  }

  submitClaim(): void {
    if (!this.claim) return;
    this.isSubmitting = true;
    const call = this.claimAction === 'confirm'
      ? this.adminService.confirmPaymentClaim(this.claim.id, { amount_received: this.claimAmount })
      : this.adminService.rejectPaymentClaim(this.claim.id, this.claimReason.trim());
    call.subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.claim = null;
        notify(res?.message || 'Saved', 'success');
        this.loadClaims();
        this.loadOverduePayments();
        this.loadCollectionStats();
      },
      error: (err: any) => { this.isSubmitting = false; notify(err?.message || 'Could not save', 'error'); }
    });
  }

  methodLabel(method: string): string {
    return ({ mobile_money: 'Mobile Money', bank_transfer: 'Bank transfer', cash: 'Cash', card: 'Card', manual: 'Manual' } as Record<string, string>)[method] || method;
  }

  loadCollectionStats(): void {
    this.adminService.getCollectionStats().subscribe({
      next: (response: any) => { this.collectionStats = response || {}; },
      error: () => { this.collectionStats = {}; }
    });
  }

  loadOverduePayments(): void {
    this.isLoading = true;
    const filters: any = {
      page: this.currentPage,
      per_page: this.pageSize,
      search: this.searchTerm,
      overdue_range: this.selectedOverdueRange
    };
    this.adminService.getOverduePayments(filters).subscribe({
      next: (response: any) => {
        this.overduePayments = response.overdue_payments || [];
        this.totalItems = response.total || 0;
        this.totalPages = response.total_pages || 1;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        notify(error?.error?.error || 'Could not load overdue accounts', 'error');
      }
    });
  }

  viewPaymentDetails(payment: OverduePayment): void {
    this.adminService.getOverduePaymentDetail(payment.id).subscribe({
      next: (response: any) => {
        this.selectedPayment = response;
        this.showPaymentModal = true;
      },
      error: (error) => notify(error?.error?.error || 'Failed to load payment details', 'error')
    });
  }

  // The detail view passes its own payment object, which has the same fields
  openReminderModal(payment: OverduePayment): void {
    this.showPaymentModal = false;
    this.selectedPayment = { payment };
    this.reminderForm.reset({ reminder_type: 'sms' });
    this.showReminderModal = true;
  }

  sendReminder(): void {
    if (this.reminderForm.invalid) return;
    this.isSubmitting = true;
    const data = this.reminderForm.value;
    this.adminService.sendPaymentReminder(this.selectedPayment.payment.id, data).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        this.showReminderModal = false;
        notify(response?.status === 'failed' ? `Reminder not sent: ${response?.message}` : 'Reminder sent',
          response?.status === 'failed' ? 'error' : 'success');
      },
      error: (error) => {
        this.isSubmitting = false;
        notify(error?.error?.error || 'Failed to send reminder', 'error');
      }
    });
  }

  openMarkReceivedModal(payment: OverduePayment): void {
    this.showPaymentModal = false;
    this.selectedPayment = { payment };
    this.markReceivedForm.reset({
      amount_received: payment.total_due,
      payment_method: 'mobile_money',
      payment_reference: ''
    });
    this.showMarkReceivedModal = true;
  }

  markAsReceived(): void {
    if (this.markReceivedForm.invalid) return;
    this.isSubmitting = true;
    const data = { ...this.markReceivedForm.value, payment_reference: (this.markReceivedForm.value.payment_reference || '').trim() };
    this.adminService.markPaymentReceived(this.selectedPayment.payment.id, data).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        this.showMarkReceivedModal = false;
        notify(response?.message || 'Payment recorded', 'success');
        this.loadOverduePayments();
        this.loadCollectionStats();
      },
      error: (error) => {
        this.isSubmitting = false;
        notify(error?.error?.error || 'Failed to record the payment', 'error');
      }
    });
  }

  exportOverduePayments(): void {
    this.adminService.exportOverduePayments({ overdue_range: this.selectedOverdueRange }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `overdue_payments_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => notify('Failed to export overdue payments', 'error')
    });
  }

  setRange(value: string): void {
    this.selectedOverdueRange = value;
    this.applyFilters();
  }

  onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.applyFilters(), 300);
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadOverduePayments();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedOverdueRange = '';
    this.applyFilters();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadOverduePayments();
  }

  dpdTone(days: number | null | undefined): 'warn' | 'error' | 'neutral' {
    if (!days) return 'neutral';
    return days > 30 ? 'error' : 'warn';
  }

  dpdLabel(days: number | null | undefined): string {
    if (!days) return 'Current';
    if (days <= 30) return 'Early delinquency';
    if (days <= 60) return 'High risk';
    if (days <= 90) return 'Default watch';
    return 'Charge-off';
  }

  closeModals(): void {
    this.showPaymentModal = false;
    this.showReminderModal = false;
    this.showMarkReceivedModal = false;
    this.selectedPayment = null;
    this.isSubmitting = false;
  }
}
