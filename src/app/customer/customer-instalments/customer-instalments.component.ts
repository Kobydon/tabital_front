// src/app/customer/components/instalments/instalments.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from 'src/app/customers.service';

export type PlanStatus = 'all' | 'active' | 'completed' | 'overdue';

export interface InstalmentPlan {
  id: number;
  plan_id: string;
  plan_name: string;
  description: string;
  merchant_name: string;
  merchant_phone: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  total_installments: number;
  paid_installments: number;
  installment_amount: number;
  down_payment: number;
  frequency: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'cancelled' | 'overdue';
  payment_status: string;
  payment_schedule: PaymentSchedule[];
}

export interface PaymentSchedule {
  id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paid_date?: string;
  payment_reference?: string;
  late_fee?: number;
}

@Component({
  selector: 'app-customer-instalments',
  templateUrl: './customer-instalments.component.html',
  styleUrls: ['./customer-instalments.component.scss']
})
export class CustomerInstalmentsComponent implements OnInit {
  // Data
  instalments: InstalmentPlan[] = [];
  filteredInstalments: InstalmentPlan[] = [];
  selectedInstalment: InstalmentPlan | null = null;
  selectedPayment: PaymentSchedule | null = null;
  
  // Stats
  stats = {
    active_plans: 0,
    completed_plans: 0,
    total_paid: 0,
    total_outstanding: 0,
    upcoming_payments: 0,
    overdue_payments: 0
  };
  
  // UI State
  isLoading = true;
  isPaying = false;
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;
  selectedStatus: PlanStatus = 'all';
  
  // Modal States
  showDetailsModal = false;
  showPaymentModal = false;
  showReceiptModal = false;
  
  // Forms
  paymentForm: FormGroup;
  
  // Status Options with proper typing
  statusOptions: { value: PlanStatus; label: string; icon: string }[] = [
    { value: 'all', label: 'All Plans', icon: '📋' },
    { value: 'active', label: 'Active', icon: '✅' },
    { value: 'completed', label: 'Completed', icon: '🎉' },
    { value: 'overdue', label: 'Overdue', icon: '⚠️' }
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
    this.loadInstalmentPlans();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  // Add this to your loadInstalmentPlans method

loadInstalmentPlans(): void {
  this.isLoading = true;
  
  const filters: any = {
    status: this.selectedStatus !== 'all' ? this.selectedStatus : ''
  };
  
  this.customerService.getMyPlans(filters).subscribe({
    next: (response: any) => {
      console.log('API Response:', JSON.stringify(response, null, 2)); // DEBUG LOG
      
      if (response && response.plans) {
        response.plans.forEach((plan: any, index: number) => {
          console.log(`Plan ${index} - ID: ${plan.id}, Name: ${plan.product_name}`);
          console.log(`Payment Schedule:`, plan.payment_schedule);
        });
      }
      
      this.instalments = (response.plans || []).map((plan: any) => this.mapInstalmentPlan(plan));
      this.filteredInstalments = this.instalments;
      this.calculateStats();
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Error loading instalment plans:', error);
      this.isLoading = false;
    }
  });
}

  private mapInstalmentPlan(plan: any): InstalmentPlan {
    const totalAmount = plan.total_amount || 0;
    const paidAmount = plan.amount_paid || 0;
    const remainingAmount = plan.amount_outstanding || (totalAmount - paidAmount);
    const paymentSchedule = (plan.payment_schedule || []).map((schedule: any) => ({
      id: schedule.id,
      installment_number: schedule.installment_number,
      due_date: schedule.due_date,
      amount: schedule.amount,
      status: schedule.status || 'pending',
      paid_date: schedule.paid_date,
      payment_reference: schedule.payment_reference,
      late_fee: schedule.late_fee || 0
    }));
    
    return {
      id: plan.id,
      plan_id: plan.plan_id,
      plan_name: plan.product_name || plan.plan_name,
      description: plan.product_description || plan.description,
      merchant_name: plan.merchant_name || 'Merchant',
      merchant_phone: plan.merchant_phone || '',
      total_amount: totalAmount,
      paid_amount: paidAmount,
      remaining_amount: remainingAmount,
      total_installments: plan.number_of_installments || plan.instalment_term || 1,
      paid_installments: plan.paid_installments || 0,
      installment_amount: plan.installment_amount || 0,
      down_payment: plan.down_payment || 0,
      frequency: plan.frequency || 'monthly',
      start_date: plan.start_date || plan.created_at,
      end_date: plan.end_date,
      status: plan.status || 'active',
      payment_status: plan.payment_status || 'pending',
      payment_schedule: paymentSchedule
    };
  }

  calculateStats(): void {
    this.stats.active_plans = this.instalments.filter(p => p.status === 'active').length;
    this.stats.completed_plans = this.instalments.filter(p => p.status === 'completed').length;
    this.stats.total_paid = this.instalments.reduce((sum, p) => sum + p.paid_amount, 0);
    this.stats.total_outstanding = this.instalments.reduce((sum, p) => sum + p.remaining_amount, 0);
    
    // Calculate upcoming and overdue payments
    const today = new Date();
    this.stats.upcoming_payments = 0;
    this.stats.overdue_payments = 0;
    
    this.instalments.forEach(plan => {
      plan.payment_schedule.forEach(payment => {
        if (payment.status === 'pending') {
          const dueDate = new Date(payment.due_date);
          if (dueDate < today) {
            this.stats.overdue_payments++;
          } else {
            this.stats.upcoming_payments++;
          }
        }
      });
    });
  }

  // ============================================
  // FILTER METHODS
  // ============================================

  filterByStatus(status: PlanStatus): void {
    this.selectedStatus = status;
    this.loadInstalmentPlans();
  }

  // ============================================
  // INSTALMENT ACTIONS
  // ============================================

  viewInstalmentDetails(instalment: InstalmentPlan): void {
    this.selectedInstalment = instalment;
    this.showDetailsModal = true;
  }

  openPaymentModal(payment: PaymentSchedule, instalment: InstalmentPlan): void {
    this.selectedPayment = payment;
    this.selectedInstalment = instalment;
    this.paymentForm.reset();
    this.paymentForm.patchValue({
      amount: payment.amount
    });
    this.showPaymentModal = true;
  }

  makePayment(): void {
    if (this.paymentForm.invalid || !this.selectedInstalment || !this.selectedPayment) return;
    
    this.isPaying = true;
    
    const paymentData = {
      plan_id: this.selectedInstalment.id,
      installment_number: this.selectedPayment.installment_number,
      amount: this.paymentForm.value.amount,
      payment_method: this.paymentForm.value.payment_method,
      payment_reference: this.paymentForm.value.payment_reference,
      notes: this.paymentForm.value.notes
    };
    
    this.customerService.makeInstalmentPayment(paymentData).subscribe({
      next: (response) => {
        this.isPaying = false;
        this.showPaymentModal = false;
        // Update local data
        if (this.selectedPayment && this.selectedInstalment) {
          this.selectedPayment.status = 'paid';
          this.selectedPayment.paid_date = new Date().toISOString();
          this.selectedPayment.payment_reference = response.payment_reference;
          this.selectedInstalment.paid_amount += this.selectedPayment.amount;
          this.selectedInstalment.remaining_amount -= this.selectedPayment.amount;
          this.selectedInstalment.paid_installments++;
          
          if (this.selectedInstalment.paid_installments === this.selectedInstalment.total_installments) {
            this.selectedInstalment.status = 'completed';
          }
        }
        
        this.loadInstalmentPlans();
        alert('Payment successful!');
      },
      error: (error) => {
        console.error('Error making payment:', error);
        this.isPaying = false;
        alert('Payment failed. Please try again.');
      }
    });
  }

  downloadReceipt(payment: PaymentSchedule, instalment: InstalmentPlan): void {
    this.customerService.downloadReceipt(instalment.id, payment.installment_number).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt_${instalment.plan_id}_inst_${payment.installment_number}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading receipt:', error);
        alert('Failed to download receipt.');
      }
    });
  }

  // ============================================
  // MODAL CONTROLS
  // ============================================

  closeModals(): void {
    this.showDetailsModal = false;
    this.showPaymentModal = false;
    this.showReceiptModal = false;
    this.selectedInstalment = null;
    this.selectedPayment = null;
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
      case 'active': return 'status-active';
      case 'completed': return 'status-completed';
      case 'overdue': return 'status-overdue';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'active': return '✅';
      case 'completed': return '🎉';
      case 'overdue': return '⚠️';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'payment-paid';
      case 'pending': return 'payment-pending';
      case 'overdue': return 'payment-overdue';
      default: return '';
    }
  }

  getPaymentStatusIcon(status: string): string {
    switch (status) {
      case 'paid': return '✅';
      case 'pending': return '⏳';
      case 'overdue': return '⚠️';
      default: return '📋';
    }
  }

  getProgressPercentage(plan: InstalmentPlan): number {
    if (!plan.total_amount || plan.total_amount === 0) return 0;
    return (plan.paid_amount / plan.total_amount) * 100;
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 75) return '#28a745';
    if (percentage >= 50) return '#17a2b8';
    if (percentage >= 25) return '#ffc107';
    return '#dc3545';
  }
}