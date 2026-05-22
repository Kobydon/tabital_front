// src/app/customer/components/transactions/transactions.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from 'src/app/customers.service';

export interface PaymentTransaction {
  id: number;
  payment_id: string;
  plan_id: number;
  plan_name: string;
  merchant_name: string;
  installment_number: number;
  amount: number;
  payment_method: string;
  payment_reference: string;
  status: string;
  paid_date: string;
  due_date: string;
}

@Component({
  selector: 'app-customer-transactions',
  templateUrl: './customer-transactions.component.html',
  styleUrls: ['./customer-transactions.component.scss']
})
export class CustomerTransactionsComponent implements OnInit {
  // Data
  transactions: PaymentTransaction[] = [];
  filteredTransactions: PaymentTransaction[] = [];
  selectedTransaction: PaymentTransaction | null = null;
  
  // Stats
  stats = {
    today: { total: 0, count: 0 },
    this_week: { total: 0, count: 0 },
    this_month: { total: 0, count: 0 },
    total_paid: 0
  };
  
  // UI State
  isLoading = true;
  totalItems = 0;
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;
  
  // Filters
  searchTerm = '';
  selectedStatus = 'all';
  startDate: string = '';
  endDate: string = '';
  
  // Modal States
  showDetailsModal = false;
  
  // Filter Options
  statusOptions = [
    { value: 'all', label: 'All', icon: '📋' },
    { value: 'paid', label: 'Paid', icon: '✅' }
  ];

  constructor(
    private customerService: CustomerService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadTransactions(): void {
    this.isLoading = true;
    
    const filters: any = {
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchTerm,
      status: this.selectedStatus !== 'all' ? this.selectedStatus : 'paid',
      start_date: this.startDate,
      end_date: this.endDate
    };
    
    // Query paid instalment payments
    this.customerService.getPaidInstalmentPayments(filters).subscribe({
      next: (response) => {
        this.transactions = response.payments || [];
        this.filteredTransactions = this.transactions;
        this.totalItems = response.total || 0;
        this.totalPages = response.total_pages || 1;
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isLoading = false;
      }
    });
  }

  calculateStats(): void {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Reset stats
    this.stats = {
      today: { total: 0, count: 0 },
      this_week: { total: 0, count: 0 },
      this_month: { total: 0, count: 0 },
      total_paid: 0
    };
    
    this.filteredTransactions.forEach(tx => {
      const txDate = new Date(tx.paid_date);
      
      // Total paid
      this.stats.total_paid += tx.amount;
      
      // Today
      if (txDate >= todayStart) {
        this.stats.today.total += tx.amount;
        this.stats.today.count++;
      }
      
      // This Week
      if (txDate >= weekStart) {
        this.stats.this_week.total += tx.amount;
        this.stats.this_week.count++;
      }
      
      // This Month
      if (txDate >= monthStart) {
        this.stats.this_month.total += tx.amount;
        this.stats.this_month.count++;
      }
    });
  }

  // ============================================
  // FILTER METHODS
  // ============================================

  applyFilters(): void {
    this.currentPage = 1;
    this.loadTransactions();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.startDate = '';
    this.endDate = '';
    this.currentPage = 1;
    this.loadTransactions();
  }

  // ============================================
  // PAGINATION
  // ============================================

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
  // TRANSACTION ACTIONS
  // ============================================

  viewTransactionDetails(transaction: PaymentTransaction): void {
    this.selectedTransaction = transaction;
    this.showDetailsModal = true;
  }

 // In customer-transactions.component.ts

downloadReceipt(transaction: PaymentTransaction): void {
  // The receipt download needs plan_id and installment_number
  this.customerService.downloadReceipt(transaction.plan_id, transaction.installment_number).subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt_${transaction.payment_id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    },
    error: (error) => {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt.');
    }
  });
}
  exportTransactions(): void {
    const filters: any = {
      search: this.searchTerm,
      status: this.selectedStatus !== 'all' ? this.selectedStatus : 'paid',
      start_date: this.startDate,
      end_date: this.endDate,
      format: 'csv'
    };
    
    this.customerService.exportPaidInstalmentPayments(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payment_history_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting transactions:', error);
        alert('Failed to export.');
      }
    });
  }

  // ============================================
  // MODAL CONTROLS
  // ============================================

  closeModals(): void {
    this.showDetailsModal = false;
    this.selectedTransaction = null;
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid': return 'status-paid';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid': return '✅';
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
}