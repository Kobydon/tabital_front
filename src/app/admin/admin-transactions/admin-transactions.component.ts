import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

interface Transaction {
  id: number;
  transaction_id: string;
  customer_name: string;
  customer_phone: string;
  merchant_name: string;
  merchant_phone: string;
  amount: number;
  payout_amount: number;
  product_name: string;
  product_description: string;
  quantity: number;
  payment_method: string;
  payment_status: string;
  payment_reference: string;
  payment_plan: string;
  status: string;
  delivery_status: string;
  tracking_number: string;
  delivery_address: string;
  notes: string;
  created_at: string;
  completion_date: string;
}

@Component({
  selector: 'app-admin-transactions',
  templateUrl: './admin-transactions.component.html',
  styleUrls: ['./admin-transactions.component.scss']
})
export class AdminTransactionsComponent implements OnInit {
  // Data
  transactions: Transaction[] = [];
  selectedTransaction: any = null;
  transactionStats: any = {};
  
  // UI State
  isLoading = true;
  showTransactionModal = false;
  showUpdateStatusModal = false;
  showUpdateDeliveryModal = false;
  showRefundModal = false;
  isSubmitting = false;
  
  // Filters
  searchTerm = '';
  selectedStatus = '';
  selectedPaymentStatus = '';
  selectedDateFrom = '';
  selectedDateTo = '';
  sortBy = 'created_at';
  sortOrder = 'desc';
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 1;
  
  // Forms
  updateStatusForm: FormGroup;
  updateDeliveryForm: FormGroup;
  refundForm: FormGroup;
  
  // Math for template
  Math = Math;
  
  // Stats Cards
  statsCards = [
    { label: 'Total Transactions', value: 0, icon: '📊', color: 'blue', suffix: '', growth: 0, isCurrency: false },
    { label: 'Total Volume', value: 0, icon: '💰', color: 'green', suffix: '', growth: 0, isCurrency: true },
    { label: 'Completed', value: 0, icon: '✅', color: 'green', suffix: '', growth: 0, isCurrency: false },
    { label: 'Pending', value: 0, icon: '⏳', color: 'orange', suffix: '', growth: 0, isCurrency: false },
    { label: 'Failed', value: 0, icon: '❌', color: 'red', suffix: '', growth: 0, isCurrency: false },
    { label: 'Avg. Transaction Value', value: 0, icon: '📈', color: 'purple', suffix: '', growth: 0, isCurrency: true }
  ];

  // Status Options
  statusOptions = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' }
  ];

  // Payment Status Options
  paymentStatusOptions = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' }
  ];

  // Delivery Status Options
  deliveryStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
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
    
    this.updateDeliveryForm = this.fb.group({
      delivery_status: ['', Validators.required],
      tracking_number: ['']
    });
    
    this.refundForm = this.fb.group({
      refund_amount: ['', [Validators.required, Validators.min(0.01)]],
      reason: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadTransactionStats();
    this.loadTransactions();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadTransactionStats(): void {
    this.adminService.getTransactionStats().subscribe({
      next: (response: any) => {
        console.log('Transaction stats:', response);
        this.transactionStats = response;
        this.updateStatsCards();
      },
      error: (error) => {
        console.error('Error loading transaction stats:', error);
      }
    });
  }

  updateStatsCards(): void {
    this.statsCards[0].value = this.transactionStats.total_transactions || 0;
    this.statsCards[1].value = this.transactionStats.total_volume || 0;
    this.statsCards[1].growth = this.transactionStats.total_volume_growth || 0;
    this.statsCards[2].value = this.transactionStats.completed_transactions || 0;
    this.statsCards[3].value = this.transactionStats.pending_transactions || 0;
    this.statsCards[4].value = this.transactionStats.failed_transactions || 0;
    this.statsCards[5].value = this.transactionStats.avg_transaction_value || 0;
  }

  loadTransactions(): void {
    this.isLoading = true;
    
    const filters: any = {
      page: this.currentPage,
      per_page: this.pageSize,
      search: this.searchTerm,
      status: this.selectedStatus,
      payment_status: this.selectedPaymentStatus,
      date_from: this.selectedDateFrom,
      date_to: this.selectedDateTo,
      sort_by: this.sortBy,
      sort_order: this.sortOrder
    };
    
    this.adminService.getAllTransactions(filters).subscribe({
      next: (response: any) => {
        console.log('Transactions response:', response);
        if (Array.isArray(response)) {
          this.transactions = response;
          this.totalItems = response.length;
          this.totalPages = 1;
        } else {
          this.transactions = response.transactions || [];
          this.totalItems = response.total || 0;
          this.totalPages = response.total_pages || 1;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isLoading = false;
      }
    });
  }

  // ============================================
  // TRANSACTION DETAILS
  // ============================================

  viewTransactionDetails(transaction: Transaction): void {
    this.adminService.getTransactionDetail(transaction.id).subscribe({
      next: (response: any) => {
        this.selectedTransaction = response;
        this.showTransactionModal = true;
      },
      error: (error) => {
        console.error('Error loading transaction details:', error);
        alert('Failed to load transaction details');
      }
    });
  }

  // ============================================
  // TRANSACTION ACTIONS
  // ============================================

  openUpdateStatusModal(transaction: Transaction): void {
    this.selectedTransaction = { transaction };
    this.updateStatusForm.patchValue({ status: transaction.status, reason: '' });
    this.showUpdateStatusModal = true;
  }

  updateTransactionStatus(): void {
    if (this.updateStatusForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.updateStatusForm.value;
    
    this.adminService.updateTransactionStatus(this.selectedTransaction.transaction.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Transaction status updated successfully');
        this.showUpdateStatusModal = false;
        this.loadTransactions();
        this.loadTransactionStats();
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.isSubmitting = false;
        alert('Failed to update status');
      }
    });
  }

  openUpdateDeliveryModal(transaction: Transaction): void {
    this.selectedTransaction = { transaction };
    this.updateDeliveryForm.patchValue({ 
      delivery_status: transaction.delivery_status || 'pending', 
      tracking_number: transaction.tracking_number || '' 
    });
    this.showUpdateDeliveryModal = true;
  }

  updateDeliveryStatus(): void {
    if (this.updateDeliveryForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.updateDeliveryForm.value;
    
    this.adminService.updateDeliveryStatus(this.selectedTransaction.transaction.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Delivery status updated successfully');
        this.showUpdateDeliveryModal = false;
        this.loadTransactions();
      },
      error: (error) => {
        console.error('Error updating delivery status:', error);
        this.isSubmitting = false;
        alert('Failed to update delivery status');
      }
    });
  }

  openRefundModal(transaction: Transaction): void {
    this.selectedTransaction = { transaction };
    this.refundForm.patchValue({ 
      refund_amount: transaction.amount, 
      reason: '' 
    });
    this.showRefundModal = true;
  }

  processRefund(): void {
    if (this.refundForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.refundForm.value;
    
    this.adminService.refundTransaction(this.selectedTransaction.transaction.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Refund processed successfully');
        this.showRefundModal = false;
        this.loadTransactions();
        this.loadTransactionStats();
      },
      error: (error) => {
        console.error('Error processing refund:', error);
        this.isSubmitting = false;
        alert('Failed to process refund');
      }
    });
  }

  exportTransactions(): void {
    const filters: any = {
      search: this.searchTerm,
      status: this.selectedStatus,
      date_from: this.selectedDateFrom,
      date_to: this.selectedDateTo
    };
    
    this.adminService.exportTransactions(filters).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        alert('Transactions exported successfully!');
      },
      error: (error) => {
        console.error('Error exporting transactions:', error);
        alert('Failed to export transactions');
      }
    });
  }

  // ============================================
  // FILTERS & SORTING
  // ============================================

  applyFilters(): void {
    this.currentPage = 1;
    this.loadTransactions();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedPaymentStatus = '';
    this.selectedDateFrom = '';
    this.selectedDateTo = '';
    this.sortBy = 'created_at';
    this.sortOrder = 'desc';
    this.currentPage = 1;
    this.loadTransactions();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'desc';
    }
    this.loadTransactions();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadTransactions();
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
      case 'completed': return 'status-completed';
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'failed': return 'status-failed';
      case 'cancelled': return 'status-cancelled';
      case 'refunded': return 'status-refunded';
      default: return '';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'paid': return 'payment-paid';
      case 'pending': return 'payment-pending';
      case 'failed': return 'payment-failed';
      case 'refunded': return 'payment-refunded';
      default: return '';
    }
  }

  getDeliveryStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'delivery-delivered';
      case 'shipped': return 'delivery-shipped';
      case 'processing': return 'delivery-processing';
      case 'pending': return 'delivery-pending';
      case 'cancelled': return 'delivery-cancelled';
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  closeModals(): void {
    this.showTransactionModal = false;
    this.showUpdateStatusModal = false;
    this.showUpdateDeliveryModal = false;
    this.showRefundModal = false;
    this.selectedTransaction = null;
    this.isSubmitting = false;
  }
}