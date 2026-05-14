import { Component, OnInit } from '@angular/core';
// import { MerchantService } from '../services/merchant.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MerchantService } from 'src/app/merchant.service';

@Component({
  selector: 'app-merchant-transactions',
  templateUrl: './merchant-transactions.component.html',
  styleUrls: ['./merchant-transactions.component.scss']
})
export class MerchantTransactionsComponent implements OnInit {
  isLoading = false;
  transactions: any[] = [];
  selectedTransaction: any = null;
  
  // Filters
  searchTerm = '';
  selectedStatus = 'all';
  selectedPaymentStatus = 'all';
  selectedType = 'all';
  startDate = '';
  endDate = '';
  currentPage = 1;
  itemsPerPage = 20;
  totalItems = 0;
  totalPages = 0;
  
  // Stats
  stats = {
    today: { count: 0, total: 0, completed: 0 },
    this_week: { count: 0, total: 0, completed: 0 },
    this_month: { count: 0, total: 0, completed: 0 },
    status_breakdown: {},
    payment_methods: {}
  };
  
  // Modal states
  showDetailsModal = false;
  showUpdateModal = false;
  showRefundModal = false;
  
  // Forms
  updateForm: FormGroup;
  refundForm: FormGroup;
  
  // Status options
  statusOptions = [
    { value: 'all', label: 'All Status', icon: '📊' },
    { value: 'pending', label: 'Pending', icon: '⏳' },
    { value: 'completed', label: 'Completed', icon: '✅' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌' },
    { value: 'refunded', label: 'Refunded', icon: '↩️' },
    { value: 'disputed', label: 'Disputed', icon: '⚠️' }
  ];
  
  paymentStatusOptions = [
    { value: 'all', label: 'All Payment Status', icon: '💳' },
    { value: 'pending', label: 'Pending', icon: '⏳' },
    { value: 'processing', label: 'Processing', icon: '🔄' },
    { value: 'completed', label: 'Completed', icon: '✅' },
    { value: 'failed', label: 'Failed', icon: '❌' },
    { value: 'refunded', label: 'Refunded', icon: '↩️' }
  ];
  
  typeOptions = [
    { value: 'all', label: 'All Types', icon: '📋' },
    { value: 'sale', label: 'Sales', icon: '💰' },
    { value: 'instalment', label: 'Instalment Plans', icon: '📅' }
  ];

  constructor(
    private merchantService: MerchantService,
    private fb: FormBuilder
  ) {
    this.updateForm = this.fb.group({
      delivery_status: [''],
      tracking_number: [''],
      notes: ['']
    });
    
    this.refundForm = this.fb.group({
      refund_amount: ['', [Validators.required, Validators.min(0.01)]],
      reason: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadTransactions();
    this.loadStats();
  }

  loadTransactions() {
    this.isLoading = true;
    const filters: any = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    
    if (this.selectedStatus !== 'all') filters.status = this.selectedStatus;
    if (this.selectedPaymentStatus !== 'all') filters.payment_status = this.selectedPaymentStatus;
    if (this.selectedType !== 'all') filters.type = this.selectedType;
    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.startDate) filters.start_date = this.startDate;
    if (this.endDate) filters.end_date = this.endDate;
    
    this.merchantService.getMerchantTransactions(filters).subscribe({
      next: (response) => {
        this.transactions = response.transactions;
        this.totalItems = response.total;
        this.totalPages = response.total_pages;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isLoading = false;
      }
    });
  }

  loadStats() {
    this.merchantService.getMerchantTransactionStats().subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadTransactions();
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.selectedPaymentStatus = 'all';
    this.selectedType = 'all';
    this.startDate = '';
    this.endDate = '';
    this.currentPage = 1;
    this.loadTransactions();
  }

  changePage(page: number) {
    this.currentPage = page;
    this.loadTransactions();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  viewTransactionDetails(transaction: any) {
    this.selectedTransaction = transaction;
    this.showDetailsModal = true;
  }

  openUpdateModal(transaction: any) {
    this.selectedTransaction = transaction;
    this.updateForm.patchValue({
      delivery_status: transaction.delivery_status,
      tracking_number: transaction.tracking_number,
      notes: transaction.notes
    });
    this.showUpdateModal = true;
  }

  updateTransaction() {
    if (this.updateForm.valid && this.selectedTransaction) {
      this.merchantService.updateTransaction(this.selectedTransaction.id, this.updateForm.value).subscribe({
        next: () => {
          this.loadTransactions();
          this.showUpdateModal = false;
          alert('Transaction updated successfully');
        },
        error: (error) => {
          console.error('Error updating transaction:', error);
          alert('Failed to update transaction');
        }
      });
    }
  }

  openRefundModal(transaction: any) {
    this.selectedTransaction = transaction;
    this.refundForm.patchValue({
      refund_amount: transaction.amount,
      reason: ''
    });
    this.showRefundModal = true;
  }

  processRefund() {
    if (this.refundForm.valid && this.selectedTransaction) {
      this.merchantService.refundTransaction(this.selectedTransaction.id, this.refundForm.value).subscribe({
        next: () => {
          this.loadTransactions();
          this.loadStats();
          this.showRefundModal = false;
          alert('Refund processed successfully');
        },
        error: (error) => {
          console.error('Error processing refund:', error);
          alert('Failed to process refund');
        }
      });
    }
  }

  updateStatus(transaction: any, status: string) {
    if (confirm(`Change transaction status to ${status}?`)) {
      this.merchantService.updateTransactionStatus(transaction.id, { status }).subscribe({
        next: () => {
          this.loadTransactions();
          this.loadStats();
          alert('Status updated successfully');
        },
        error: (error) => {
          console.error('Error updating status:', error);
          alert('Failed to update status');
        }
      });
    }
  }

  exportTransactions() {
    const filters: any = {};
    if (this.startDate) filters.start_date = this.startDate;
    if (this.endDate) filters.end_date = this.endDate;
    
    this.merchantService.exportTransactions(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        alert('Export started');
      },
      error: (error) => {
        console.error('Error exporting transactions:', error);
        alert('Failed to export transactions');
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount || 0);
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      case 'refunded': return 'status-refunded';
      case 'disputed': return 'status-disputed';
      default: return 'status-default';
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'completed': return '✅';
      case 'pending': return '⏳';
      case 'cancelled': return '❌';
      case 'refunded': return '↩️';
      case 'disputed': return '⚠️';
      default: return '📌';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch(status) {
      case 'completed': return 'payment-completed';
      case 'processing': return 'payment-processing';
      case 'pending': return 'payment-pending';
      case 'failed': return 'payment-failed';
      case 'refunded': return 'payment-refunded';
      default: return 'payment-default';
    }
  }

  getDeliveryStatusIcon(status: string): string {
    switch(status) {
      case 'delivered': return '📦✅';
      case 'shipped': return '🚚';
      case 'processing': return '🔄';
      case 'pending': return '⏳';
      default: return '📦';
    }
  }

  closeModals() {
    this.showDetailsModal = false;
    this.showUpdateModal = false;
    this.showRefundModal = false;
    this.updateForm.reset();
    this.refundForm.reset();
  }
}