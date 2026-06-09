import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

interface InstalmentPlan {
  id: number;
  plan_id: string;
  customer_name: string;
  merchant_name: string;
  plan_name: string;
  total_amount: number;
  down_payment: number;
  remaining_amount: number;
  paid_amount: number;
  number_of_installments: number;
  installment_amount: number;
  paid_installments: number;
  missed_payments: number;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

@Component({
  selector: 'app-admin-instalments',
  templateUrl: './admin-instalments.component.html',
  styleUrls: ['./admin-instalments.component.scss']
})
export class AdminInstalmentsComponent implements OnInit {
  // Data
  instalments: InstalmentPlan[] = [];
  selectedPlan: any = null;
  selectedPayment: any = null;
  instalmentStats: any = {};
  
  // UI State
  isLoading = true;
  showPlanModal = false;
  showPaymentModal = false;
  showUpdateStatusModal = false;
  showApplyLateFeeModal = false;
  showWaiveLateFeeModal = false;
  showMarkPaidModal = false;
  isSubmitting = false;
  
  // Filters
  searchTerm = '';
  selectedStatus = '';
  selectedCustomerId = '';
  selectedMerchantId = '';
  sortBy = 'created_at';
  sortOrder = 'desc';
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 1;
  
  // Forms
  updateStatusForm: FormGroup;
  waiveLateFeeForm: FormGroup;
  markPaidForm: FormGroup;
  
  // Math for template
  Math = Math;
  
  // Stats Cards
  statsCards = [
    { label: 'Active Plans', value: 0, icon: '📋', color: 'blue', suffix: '', isCurrency: false },
    { label: 'Completed Plans', value: 0, icon: '✅', color: 'green', suffix: '', isCurrency: false },
    { label: 'Defaulted Plans', value: 0, icon: '⚠️', color: 'red', suffix: '', isCurrency: false },
    { label: 'Total Outstanding', value: 0, icon: '💰', color: 'orange', suffix: '', isCurrency: true },
    { label: 'Collection Rate', value: 0, icon: '📈', color: 'purple', suffix: '%', isCurrency: false },
    { label: 'Overdue Payments', value: 0, icon: '⏰', color: 'red', suffix: '', isCurrency: false }
  ];

  // Status Options
  statusOptions = [
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'defaulted', label: 'Defaulted' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.updateStatusForm = this.fb.group({
      status: ['', Validators.required],
      reason: ['']
    });
    
    this.waiveLateFeeForm = this.fb.group({
      reason: ['', Validators.required]
    });
    
    this.markPaidForm = this.fb.group({
      payment_method: ['manual', Validators.required],
      payment_reference: ['']
    });
  }

  ngOnInit(): void {
    this.loadInstalmentStats();
    this.loadInstalments();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadInstalmentStats(): void {
    this.adminService.getInstalmentStats().subscribe({
      next: (response: any) => {
        console.log('Instalment stats:', response);
        this.instalmentStats = response;
        this.updateStatsCards();
      },
      error: (error) => {
        console.error('Error loading instalment stats:', error);
      }
    });
  }

  updateStatsCards(): void {
    this.statsCards[0].value = this.instalmentStats.total_active_plans || 0;
    this.statsCards[1].value = this.instalmentStats.total_completed_plans || 0;
    this.statsCards[2].value = this.instalmentStats.total_defaulted_plans || 0;
    this.statsCards[3].value = this.instalmentStats.total_outstanding || 0;
    this.statsCards[4].value = this.instalmentStats.collection_rate || 0;
    this.statsCards[5].value = this.instalmentStats.overdue_payments || 0;
  }

  loadInstalments(): void {
    this.isLoading = true;
    
    const filters: any = {
      page: this.currentPage,
      per_page: this.pageSize,
      search: this.searchTerm,
      status: this.selectedStatus,
      sort_by: this.sortBy,
      sort_order: this.sortOrder
    };
    
    this.adminService.getAllInstalments(filters).subscribe({
      next: (response: any) => {
        console.log('Instalments response:', response);
        if (Array.isArray(response)) {
          this.instalments = response;
          this.totalItems = response.length;
          this.totalPages = 1;
        } else {
          this.instalments = response.plans || [];
          this.totalItems = response.total || 0;
          this.totalPages = response.total_pages || 1;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading instalments:', error);
        this.isLoading = false;
      }
    });
  }

  // ============================================
  // PLAN DETAILS
  // ============================================

  viewPlanDetails(plan: InstalmentPlan): void {
    this.adminService.getInstalmentDetail(plan.id).subscribe({
      next: (response: any) => {
        this.selectedPlan = response;
        this.showPlanModal = true;
      },
      error: (error) => {
        console.error('Error loading plan details:', error);
        alert('Failed to load plan details');
      }
    });
  }

  viewPaymentDetails(payment: any): void {
    this.selectedPayment = payment;
    this.showPaymentModal = true;
  }

  // ============================================
  // PLAN ACTIONS
  // ============================================

  openUpdateStatusModal(plan: InstalmentPlan): void {
    this.selectedPlan = { plan };
    this.updateStatusForm.patchValue({ status: plan.status, reason: '' });
    this.showUpdateStatusModal = true;
  }

  updatePlanStatus(): void {
    if (this.updateStatusForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.updateStatusForm.value;
    
    this.adminService.updateInstalmentStatus(this.selectedPlan.plan.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Plan status updated successfully');
        this.showUpdateStatusModal = false;
        this.loadInstalments();
        this.loadInstalmentStats();
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.isSubmitting = false;
        alert('Failed to update status');
      }
    });
  }

  // ============================================
  // PAYMENT ACTIONS
  // ============================================

  openApplyLateFeeModal(payment: any): void {
    this.selectedPayment = payment;
    this.showApplyLateFeeModal = true;
  }

  applyLateFee(): void {
    this.isSubmitting = true;
    
    this.adminService.applyLateFee(this.selectedPayment.id).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Late fee applied successfully');
        this.showApplyLateFeeModal = false;
        this.loadInstalments();
        this.loadInstalmentStats();
      },
      error: (error) => {
        console.error('Error applying late fee:', error);
        this.isSubmitting = false;
        alert('Failed to apply late fee');
      }
    });
  }

  openWaiveLateFeeModal(payment: any): void {
    this.selectedPayment = payment;
    this.waiveLateFeeForm.reset();
    this.showWaiveLateFeeModal = true;
  }

  waiveLateFee(): void {
    if (this.waiveLateFeeForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.waiveLateFeeForm.value;
    
    this.adminService.waiveLateFee(this.selectedPayment.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Late fee waived successfully');
        this.showWaiveLateFeeModal = false;
        this.loadInstalments();
        this.loadInstalmentStats();
      },
      error: (error) => {
        console.error('Error waiving late fee:', error);
        this.isSubmitting = false;
        alert('Failed to waive late fee');
      }
    });
  }

  openMarkPaidModal(payment: any): void {
    this.selectedPayment = payment;
    this.markPaidForm.patchValue({ 
      payment_method: 'manual', 
      payment_reference: '' 
    });
    this.showMarkPaidModal = true;
  }

  markAsPaid(): void {
    if (this.markPaidForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.markPaidForm.value;
    
    this.adminService.markPaymentAsPaid(this.selectedPayment.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Payment marked as paid successfully');
        this.showMarkPaidModal = false;
        this.loadInstalments();
        this.loadInstalmentStats();
      },
      error: (error) => {
        console.error('Error marking payment as paid:', error);
        this.isSubmitting = false;
        alert('Failed to mark payment as paid');
      }
    });
  }

  exportInstalments(): void {
    const filters: any = {
      status: this.selectedStatus
    };
    
    this.adminService.exportInstalments(filters).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `instalments_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        alert('Instalments exported successfully!');
      },
      error: (error) => {
        console.error('Error exporting instalments:', error);
        alert('Failed to export instalments');
      }
    });
  }

  // ============================================
  // FILTERS & SORTING
  // ============================================

  applyFilters(): void {
    this.currentPage = 1;
    this.loadInstalments();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.sortBy = 'created_at';
    this.sortOrder = 'desc';
    this.currentPage = 1;
    this.loadInstalments();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'desc';
    }
    this.loadInstalments();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadInstalments();
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

  getStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'active': return 'status-active';
      case 'completed': return 'status-completed';
      case 'defaulted': return 'status-defaulted';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'paid': return 'payment-paid';
      case 'pending': return 'payment-pending';
      case 'overdue': return 'payment-overdue';
      case 'partial': return 'payment-partial';
      default: return '';
    }
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
    this.showPlanModal = false;
    this.showPaymentModal = false;
    this.showUpdateStatusModal = false;
    this.showApplyLateFeeModal = false;
    this.showWaiveLateFeeModal = false;
    this.showMarkPaidModal = false;
    this.selectedPlan = null;
    this.selectedPayment = null;
    this.isSubmitting = false;
  }
}