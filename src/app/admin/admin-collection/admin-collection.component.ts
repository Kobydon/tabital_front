import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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
  total_due: number;
  due_date: string;
  days_overdue: number;
  overdue_range: string;
  status: string;
  collection_stage: string;
}

@Component({
  selector: 'app-admin-collection',
  templateUrl: './admin-collection.component.html',
  styleUrls: ['./admin-collection.component.scss']
})
export class AdminCollectionComponent implements OnInit {
  // Data
  overduePayments: OverduePayment[] = [];
  selectedPayment: any = null;
  collectionStats: any = {};
  
  // UI State
  isLoading = true;
  showPaymentModal = false;
  showReminderModal = false;
  showMarkReceivedModal = false;
  showPaymentPlanModal = false;
  isSubmitting = false;
  
  // Filters
  searchTerm = '';
  selectedOverdueRange = '';
  selectedStatus = '';
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 1;
  
  // Forms
  reminderForm: FormGroup;
  markReceivedForm: FormGroup;
  paymentPlanForm: FormGroup;
  
  // Math for template
  Math = Math;
  
  // Stats Cards
  statsCards = [
    { label: 'Total Overdue Amount', value: 0, icon: '💰', color: 'red', growth: 0, isCurrency: true },
    { label: 'Accounts Overdue', value: 0, icon: '👥', color: 'orange', growth: 0, isCurrency: false },
    { label: '1-15 Days Overdue', value: 0, icon: '📅', color: 'yellow', growth: 0, isCurrency: true },
    { label: '16-30 Days Overdue', value: 0, icon: '📅', color: 'orange', growth: 0, isCurrency: true },
    { label: '31-60 Days Overdue', value: 0, icon: '⚠️', color: 'red', growth: 0, isCurrency: true },
    { label: '60+ Days Overdue', value: 0, icon: '🚨', color: 'darkred', growth: 0, isCurrency: true }
  ];

  // Overdue Range Options
  overdueRangeOptions = [
    { value: '', label: 'All Overdue' },
    { value: '1-15', label: '1-15 Days' },
    { value: '16-30', label: '16-30 Days' },
    { value: '31-60', label: '31-60 Days' },
    { value: '60+', label: '60+ Days' }
  ];

  // Reminder Type Options
  reminderTypeOptions = [
    { value: 'sms', label: 'SMS', icon: 'fa-envelope' },
    { value: 'whatsapp', label: 'WhatsApp', icon: 'fa-whatsapp' },
    { value: 'email', label: 'Email', icon: 'fa-at' }
  ];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.reminderForm = this.fb.group({
      reminder_type: ['sms', Validators.required]
    });
    
    this.markReceivedForm = this.fb.group({
      amount_received: ['', [Validators.required, Validators.min(0.01)]],
      payment_method: ['manual', Validators.required],
      payment_reference: ['']
    });
    
    this.paymentPlanForm = this.fb.group({
      plan_type: ['installments', Validators.required],
      new_due_date: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadCollectionStats();
    this.loadOverduePayments();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadCollectionStats(): void {
    this.adminService.getCollectionStats().subscribe({
      next: (response: any) => {
        console.log('Collection stats:', response);
        this.collectionStats = response;
        this.updateStatsCards();
      },
      error: (error) => {
        console.error('Error loading collection stats:', error);
      }
    });
  }

  updateStatsCards(): void {
    this.statsCards[0].value = this.collectionStats.total_overdue || 0;
    this.statsCards[0].growth = this.collectionStats.total_overdue_growth || 0;
    this.statsCards[1].value = this.collectionStats.accounts_overdue || 0;
    this.statsCards[1].growth = this.collectionStats.accounts_overdue_growth || 0;
    this.statsCards[2].value = this.collectionStats.overdue_1_15 || 0;
    this.statsCards[2].growth = this.collectionStats.overdue_1_15_growth || 0;
    this.statsCards[3].value = this.collectionStats.overdue_16_30 || 0;
    this.statsCards[3].growth = this.collectionStats.overdue_16_30_growth || 0;
    this.statsCards[4].value = this.collectionStats.overdue_31_60 || 0;
    this.statsCards[4].growth = this.collectionStats.overdue_31_60_growth || 0;
    this.statsCards[5].value = this.collectionStats.overdue_60_plus || 0;
    this.statsCards[5].growth = this.collectionStats.overdue_60_plus_growth || 0;
  }

  loadOverduePayments(): void {
    this.isLoading = true;
    
    const filters: any = {
      page: this.currentPage,
      per_page: this.pageSize,
      search: this.searchTerm,
      overdue_range: this.selectedOverdueRange,
      status: this.selectedStatus
    };
    
    this.adminService.getOverduePayments(filters).subscribe({
      next: (response: any) => {
        console.log('Overdue payments response:', response);
        if (Array.isArray(response)) {
          this.overduePayments = response;
          this.totalItems = response.length;
          this.totalPages = 1;
        } else {
          this.overduePayments = response.overdue_payments || [];
          this.totalItems = response.total || 0;
          this.totalPages = response.total_pages || 1;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading overdue payments:', error);
        this.isLoading = false;
      }
    });
  }

  // ============================================
  // PAYMENT DETAILS
  // ============================================

  viewPaymentDetails(payment: OverduePayment): void {
    this.adminService.getOverduePaymentDetail(payment.id).subscribe({
      next: (response: any) => {
        this.selectedPayment = response;
        this.showPaymentModal = true;
      },
      error: (error) => {
        console.error('Error loading payment details:', error);
        alert('Failed to load payment details');
      }
    });
  }

  // ============================================
  // COLLECTION ACTIONS
  // ============================================

  openReminderModal(payment: OverduePayment): void {
    this.selectedPayment = { payment };
    this.reminderForm.patchValue({ reminder_type: 'sms' });
    this.showReminderModal = true;
  }

  sendReminder(): void {
    if (this.reminderForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.reminderForm.value;
    
    this.adminService.sendPaymentReminder(this.selectedPayment.payment.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert(`Reminder sent via ${data.reminder_type}`);
        this.showReminderModal = false;
      },
      error: (error) => {
        console.error('Error sending reminder:', error);
        this.isSubmitting = false;
        alert('Failed to send reminder');
      }
    });
  }

  openMarkReceivedModal(payment: OverduePayment): void {
    this.selectedPayment = { payment };
    this.markReceivedForm.patchValue({ 
      amount_received: payment.total_due,
      payment_method: 'manual',
      payment_reference: ''
    });
    this.showMarkReceivedModal = true;
  }

  markAsReceived(): void {
    if (this.markReceivedForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.markReceivedForm.value;
    
    this.adminService.markPaymentReceived(this.selectedPayment.payment.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Payment marked as received');
        this.showMarkReceivedModal = false;
        this.loadOverduePayments();
        this.loadCollectionStats();
      },
      error: (error) => {
        console.error('Error marking payment:', error);
        this.isSubmitting = false;
        alert('Failed to mark payment');
      }
    });
  }

  openPaymentPlanModal(payment: OverduePayment): void {
    this.selectedPayment = { payment };
    this.paymentPlanForm.reset({ plan_type: 'installments', notes: '' });
    this.showPaymentPlanModal = true;
  }

  setPaymentPlan(): void {
    if (this.paymentPlanForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.paymentPlanForm.value;
    
    this.adminService.setPaymentPlan(this.selectedPayment.payment.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Payment plan arranged successfully');
        this.showPaymentPlanModal = false;
      },
      error: (error) => {
        console.error('Error setting payment plan:', error);
        this.isSubmitting = false;
        alert('Failed to set payment plan');
      }
    });
  }

  exportOverduePayments(): void {
    const filters: any = {
      overdue_range: this.selectedOverdueRange
    };
    
    this.adminService.exportOverduePayments(filters).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `overdue_payments_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        alert('Overdue payments exported successfully!');
      },
      error: (error) => {
        console.error('Error exporting overdue payments:', error);
        alert('Failed to export overdue payments');
      }
    });
  }

  // ============================================
  // FILTERS & SORTING
  // ============================================

  applyFilters(): void {
    this.currentPage = 1;
    this.loadOverduePayments();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedOverdueRange = '';
    this.selectedStatus = '';
    this.currentPage = 1;
    this.loadOverduePayments();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadOverduePayments();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  getOverdueRangeClass(range: string): string {
    switch(range) {
      case '1-15 Days': return 'range-1-15';
      case '16-30 Days': return 'range-16-30';
      case '31-60 Days': return 'range-31-60';
      case '60+ Days': return 'range-60-plus';
      default: return '';
    }
  }

  getCollectionStageClass(stage: string): string {
    switch(stage) {
      case 'Payment Reminder': return 'stage-reminder';
      case 'Late Fee Applied': return 'stage-late-fee';
      case 'Agent Assigned': return 'stage-agent';
      case 'Escalated to Legal': return 'stage-legal';
      default: return '';
    }
  }

  getTrendClass(growth: number): string {
    if (growth > 0) return 'trend-up';
    if (growth < 0) return 'trend-down';
    return 'trend-neutral';
  }

  formatCurrency(amount: number): string {
    if (!amount && amount !== 0) return 'GHS 0.00';
    return new Intl.NumberFormat('en-GH', { 
      style: 'currency', 
      currency: 'GHS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatNumber(num: number): string {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  closeModals(): void {
    this.showPaymentModal = false;
    this.showReminderModal = false;
    this.showMarkReceivedModal = false;
    this.showPaymentPlanModal = false;
    this.selectedPayment = null;
    this.isSubmitting = false;
  }
}