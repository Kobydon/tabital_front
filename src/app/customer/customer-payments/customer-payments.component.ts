// src/app/customer/components/payments/payments.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from 'src/app/customers.service';

export interface Payment {
  id: number;
  payment_id: string;
  plan_id: number;
  plan_name: string;
  merchant_name: string;
  installment_number: number;
  amount: number;
  paid_amount: number;
  due_date: string;
  paid_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  payment_method: string;
  payment_reference: string;
  late_fee: number;
  late_fee_paid: boolean;
}

export interface PaymentPlan {
  id: number;
  plan_id: string;
  plan_name: string;
  merchant_name: string;
  total_amount: number;
  remaining_amount: number;
  paid_amount: number;
  number_of_installments: number;
  paid_installments: number;
  installment_amount: number;
  frequency: string;
  status: string;
  next_payment_due: string;
  next_payment_amount: number;
  payment_schedule: any[];
}

@Component({
  selector: 'app-customer-payments',
  templateUrl: './customer-payments.component.html',
  styleUrls: ['./customer-payments.component.scss']
})
export class CustomerPaymentsComponent implements OnInit {
  // Data
  Math=Math
  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  activePlans: PaymentPlan[] = [];
  selectedPayment: Payment | null = null;
  selectedPlan: PaymentPlan | null = null;
  
  // Stats
  stats = {
    total_paid: 0,
    total_due: 0,
    overdue_count: 0,
    upcoming_count: 0,
    on_time_rate: 100
  };
  
  // UI State
  isLoading = true;
  isLoadingPlans = true;
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;
  activeTab: 'upcoming' | 'history' = 'upcoming';
  
  // Filters
  searchTerm = '';
  selectedStatus = 'all';
  startDate: string = '';
  endDate: string = '';
  
  // Modal States
  showPaymentModal = false;
  showPlanDetailsModal = false;
  showReceiptModal = false;
  
  // Forms
  paymentForm: FormGroup;
  
  // Filter Options
  statusOptions = [
    { value: 'all', label: 'All', icon: '📋' },
    { value: 'pending', label: 'Pending', icon: '⏳' },
    { value: 'paid', label: 'Paid', icon: '✅' },
    { value: 'overdue', label: 'Overdue', icon: '⚠️' },
    { value: 'partial', label: 'Partial', icon: '🔄' }
  ];
  
  paymentMethods = [
    { value: 'mobile_money', label: 'Mobile Money', icon: '📱' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
    { value: 'card', label: 'Card Payment', icon: '💳' },
    { value: 'cash', label: 'Cash', icon: '💰' }
  ];

  constructor(
    private customerService: CustomerService,
    private fb: FormBuilder
  ) {
    this.paymentForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      payment_method: ['', Validators.required],
      payment_reference: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadActivePlans();
    this.loadPayments();
    this.loadPaymentStats();
  }

  // ============================================
  // DATA LOADING METHODS
  // ============================================

  loadActivePlans(): void {
    this.isLoadingPlans = true;
    
    this.customerService.getMyPlans({ status: 'active' }).subscribe({
      next: (response: any) => {
        console.log('Active Plans Response:', response);
        
        if (response && response.plans) {
          this.activePlans = response.plans.map((plan: any) => {
            // Find next pending payment
            const nextPayment = (plan.payment_schedule || []).find((p: any) => p.status === 'pending');
            
            return {
              id: plan.id,
              plan_id: plan.plan_id,
              plan_name: plan.product_name,
              merchant_name: plan.merchant_name,
              total_amount: plan.total_amount,
              remaining_amount: plan.amount_outstanding,
              paid_amount: plan.amount_paid,
              number_of_installments: plan.number_of_installments,
              paid_installments: plan.paid_installments,
              installment_amount: plan.installment_amount,
              frequency: plan.frequency,
              status: plan.status,
              next_payment_due: nextPayment?.due_date || '',
              next_payment_amount: nextPayment?.amount || plan.installment_amount,
              payment_schedule: plan.payment_schedule || []
            };
          });
        }
        this.isLoadingPlans = false;
      },
      error: (error) => {
        console.error('Error loading active plans:', error);
        this.isLoadingPlans = false;
        this.activePlans = [];
      }
    });
  }

  loadPayments(): void {
    this.isLoading = true;
    
    const filters: any = {
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchTerm,
      status: this.selectedStatus !== 'all' ? this.selectedStatus : '',
      start_date: this.startDate,
      end_date: this.endDate
    };
    
    this.customerService.getPaymentHistory(filters).subscribe({
      next: (response: any) => {
        this.payments = (response.payments || []).map((p: any) => ({
          id: p.id,
          payment_id: p.payment_id || p.id,
          plan_id: p.plan_id,
          plan_name: p.plan_name || p.product_name || 'N/A',
          merchant_name: p.merchant_name || 'Merchant',
          installment_number: p.installment_number || 1,
          amount: p.amount || 0,
          paid_amount: p.paid_amount || p.amount || 0,
          due_date: p.due_date || p.created_at,
          paid_date: p.paid_date || p.created_at,
          status: p.status || 'pending',
          payment_method: p.payment_method || 'N/A',
          payment_reference: p.payment_reference || '',
          late_fee: p.late_fee || 0,
          late_fee_paid: p.late_fee_paid || false
        }));
        this.filteredPayments = [...this.payments];
        this.totalItems = response.total || this.payments.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.isLoading = false;
        this.payments = [];
        this.filteredPayments = [];
        this.totalItems = 0;
        this.totalPages = 1;
      }
    });
  }

  loadPaymentStats(): void {
    this.customerService.getPaymentHistory({ limit: 1000 }).subscribe({
      next: (response: any) => {
        const payments = response.payments || [];
        
        this.stats.total_paid = payments
          .filter((p: any) => p.status === 'paid')
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        
        this.stats.total_due = payments
          .filter((p: any) => p.status === 'pending')
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        
        this.stats.overdue_count = payments.filter((p: any) => p.status === 'overdue').length;
        this.stats.upcoming_count = payments.filter((p: any) => p.status === 'pending').length;
        
        const totalDue = payments.filter((p: any) => p.status !== 'paid').length;
        const onTime = payments.filter((p: any) => p.status === 'paid' && !p.late_fee_paid).length;
        this.stats.on_time_rate = totalDue > 0 ? Math.round((onTime / totalDue) * 100) : 100;
      },
      error: (error) => {
        console.error('Error loading payment stats:', error);
      }
    });
  }

  // ============================================
  // FILTER METHODS
  // ============================================

  applyFilters(): void {
    this.currentPage = 1;
    this.loadPayments();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.startDate = '';
    this.endDate = '';
    this.currentPage = 1;
    this.loadPayments();
  }

  switchTab(tab: 'upcoming' | 'history'): void {
    this.activeTab = tab;
    if (tab === 'history') {
      this.loadPayments();
    } else {
      this.loadActivePlans();
    }
  }

  // ============================================
  // PAYMENT ACTIONS
  // ============================================

  openPaymentModal(plan: PaymentPlan | null): void {
    if (!plan) return;
    
    this.selectedPlan = plan;
    this.paymentForm.reset();
    this.paymentForm.patchValue({
      amount: plan.next_payment_amount || plan.installment_amount
    });
    this.showPaymentModal = true;
  }

  makePayment(): void {
    if (this.paymentForm.invalid || !this.selectedPlan) return;
    
    this.isLoading = true;
    
    const paymentData = {
      plan_id: this.selectedPlan.id,
      amount: this.paymentForm.value.amount,
      payment_method: this.paymentForm.value.payment_method,
      payment_reference: this.paymentForm.value.payment_reference,
      notes: this.paymentForm.value.notes
    };
    
    this.customerService.makePayment(paymentData).subscribe({
      next: (response: any) => {
        this.showPaymentModal = false;
        this.loadActivePlans();
        this.loadPayments();
        this.loadPaymentStats();
        alert('Payment successful!');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error making payment:', error);
        alert('Payment failed. Please try again.');
        this.isLoading = false;
      }
    });
  }

  viewPaymentDetails(payment: Payment): void {
    this.selectedPayment = payment;
    this.showReceiptModal = true;
  }

  viewPlanDetails(plan: PaymentPlan): void {
    this.selectedPlan = plan;
    this.showPlanDetailsModal = true;
  }

  downloadReceipt(payment: Payment): void {
    const startDate = payment.paid_date ? payment.paid_date.split('T')[0] : new Date().toISOString().split('T')[0];
    
    this.customerService.downloadStatement({
      start_date: startDate,
      end_date: startDate,
      format: 'pdf'
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt_${payment.payment_id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading receipt:', error);
        alert('Failed to download receipt. Please try again.');
      }
    });
  }

  requestReminder(plan: PaymentPlan): void {
    this.customerService.requestPaymentReminder().subscribe({
      next: (response: any) => {
        alert('Payment reminder sent successfully!');
      },
      error: (error) => {
        console.error('Error sending reminder:', error);
        alert('Failed to send reminder. Please try again.');
      }
    });
  }

  exportTransactions(): void {
    const filters: any = {
      search: this.searchTerm,
      status: this.selectedStatus !== 'all' ? this.selectedStatus : '',
      start_date: this.startDate,
      end_date: this.endDate,
      format: 'csv'
    };
    
    this.customerService.exportTransactions(filters).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payment_history_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting transactions:', error);
        alert('Failed to export. Please try again.');
      }
    });
  }

  // ============================================
  // MODAL CONTROLS
  // ============================================

  closeModals(): void {
    this.showPaymentModal = false;
    this.showPlanDetailsModal = false;
    this.showReceiptModal = false;
    this.selectedPayment = null;
    this.selectedPlan = null;
  }

  // ============================================
  // PAGINATION
  // ============================================

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadPayments();
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

  formatCurrency(amount: number): string {
    if (!amount && amount !== 0) return 'GHS 0.00';
    return new Intl.NumberFormat('en-GH', { 
      style: 'currency', 
      currency: 'GHS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
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

  formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDaysRemaining(dateString: string): number {
    if (!dateString) return 0;
    const dueDate = new Date(dateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'status-paid';
      case 'pending': return 'status-pending';
      case 'overdue': return 'status-overdue';
      case 'partial': return 'status-partial';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'paid': return '✅';
      case 'pending': return '⏳';
      case 'overdue': return '⚠️';
      case 'partial': return '🔄';
      default: return '📋';
    }
  }

  getPaymentMethodIcon(method: string): string {
    switch (method) {
      case 'mobile_money': return '📱';
      case 'bank_transfer': return '🏦';
      case 'card': return '💳';
      case 'cash': return '💰';
      default: return '💳';
    }
  }

  getProgressPercentage(plan: PaymentPlan): number {
    if (!plan.total_amount || plan.total_amount === 0) return 0;
    return Math.round((plan.paid_amount / plan.total_amount) * 100);
  }
}