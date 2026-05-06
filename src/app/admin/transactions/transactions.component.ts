import { Component, OnInit, HostListener } from '@angular/core';
import { AdminService, Transaction } from '../admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit {
  // Data properties
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  selectedTransaction: Transaction | null = null;
  
  // UI state
  loading = false;
  searchTerm = '';
  selectedStatus = 'all';
  selectedPaymentStatus = 'all';
  startDate = '';
  endDate = '';
  currentPage = 1;
  itemsPerPage = 10;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Modal states
  showDetailModal = false;
  showUpdateModal = false;
  showDeleteModal = false;
  showCreateModal = false;
  showActionSheet = false;
  
  // Touch properties
  touchStartX = 0;
  touchEndX = 0;
  
  // Forms
  updateForm: FormGroup;
  createForm: FormGroup;
  
  // Screen size detection
  isMobile = false;
  
  // Stats
  stats = {
    total_transactions: 0,
    total_amount: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    monthly_stats: []
  };
  
  // Merchants list for create form
  merchants: any[] = [];

  // Status options
  statusOptions = [
    { value: 'all', label: 'All Status', icon: '📊' },
    { value: 'pending', label: 'Pending', icon: '⏳' },
    { value: 'approved', label: 'Approved', icon: '✓' },
    { value: 'completed', label: 'Completed', icon: '✅' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌' },
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

  deliveryStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' }
  ];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.updateForm = this.createUpdateForm();
    this.createForm = this.createCreateForm();
  }

  ngOnInit(): void {
    this.checkScreenSize();
    this.loadTransactions();
    this.loadStats();
    this.loadMerchants();
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
  }

  createUpdateForm(): FormGroup {
    return this.fb.group({
      status: [''],
      payment_status: [''],
      delivery_status: [''],
      tracking_number: [''],
      payment_reference: [''],
      notes: ['']
    });
  }

  createCreateForm(): FormGroup {
    return this.fb.group({
      merchant_id: ['', Validators.required],
      product_name: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      product_description: [''],
      payment_method: [''],
      delivery_address: [''],
      notes: ['']
    });
  }

  loadTransactions() {
    this.loading = true;
    const filters: any = {};
    if (this.selectedStatus !== 'all') filters.status = this.selectedStatus;
    if (this.selectedPaymentStatus !== 'all') filters.payment_status = this.selectedPaymentStatus;
    if (this.startDate) filters.start_date = this.startDate;
    if (this.endDate) filters.end_date = this.endDate;
    if (this.searchTerm) filters.search = this.searchTerm;
    
    this.adminService.getTransactions(filters).subscribe({
      next: (data: Transaction[]) => {
        this.transactions = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.loading = false;
        this.handleError(error);
      }
    });
  }

  loadStats() {
    this.adminService.getTransactionStats().subscribe({
      next: (data: any) => {
        this.stats = data;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  loadMerchants() {
    this.adminService.getMerchants().subscribe({
      next: (data: any[]) => {
        this.merchants = data;
      },
      error: (error) => {
        console.error('Error loading merchants:', error);
      }
    });
  }

  applyFilters() {
    let filtered = [...this.transactions];
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.transaction_id.toLowerCase().includes(term) ||
        t.product_name.toLowerCase().includes(term) ||
        t.customer_name.toLowerCase().includes(term) ||
        t.merchant_name.toLowerCase().includes(term)
      );
    }
    
    if (this.sortColumn) {
      filtered.sort((a, b) => {
        let aVal: any = a[this.sortColumn as keyof Transaction];
        let bVal: any = b[this.sortColumn as keyof Transaction];
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return this.sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          return this.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }
    
    this.filteredTransactions = filtered;
    this.currentPage = 1;
  }

  onSearchChange() {
    this.loadTransactions();
  }

  onStatusChange() {
    this.loadTransactions();
  }

  onPaymentStatusChange() {
    this.loadTransactions();
  }

  onDateChange() {
    this.loadTransactions();
  }

  sort(columnName: string): void {
    if (this.sortColumn === columnName) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = columnName;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  getSortIcon(columnName: string): string {
    if (this.sortColumn !== columnName) return '↕️';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  get paginatedTransactions(): Transaction[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredTransactions.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = this.isMobile ? 3 : 5;
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

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent, transaction: Transaction): void {
    this.touchEndX = event.changedTouches[0].clientX;
    const swipeDistance = this.touchEndX - this.touchStartX;
    
    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance > 0) {
        this.onSwipeRight(transaction);
      } else {
        this.onSwipeLeft(transaction);
      }
    }
  }

  onSwipeLeft(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.showActionSheet = true;
  }

  onSwipeRight(transaction: Transaction): void {
    this.viewTransactionDetails(transaction);
  }

  viewTransactionDetails(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.showDetailModal = true;
    this.showActionSheet = false;
  }

  openUpdateModal(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.updateForm.patchValue({
      status: transaction.status,
      payment_status: transaction.payment_status,
      delivery_status: transaction.delivery_status,
      tracking_number: transaction.tracking_number,
      payment_reference: transaction.payment_reference,
      notes: transaction.notes
    });
    this.showUpdateModal = true;
    this.showDetailModal = false;
    this.showActionSheet = false;
  }

  openCreateModal(): void {
    this.createForm.reset({
      quantity: 1
    });
    this.showCreateModal = true;
  }

  updateTransaction(): void {
    if (this.selectedTransaction) {
      this.loading = true;
      const updateData: any = {};
      Object.keys(this.updateForm.value).forEach(key => {
        if (this.updateForm.value[key]) {
          updateData[key] = this.updateForm.value[key];
        }
      });
      
      this.adminService.updateTransactionStatus(this.selectedTransaction.id, updateData).subscribe({
        next: () => {
          this.loadTransactions();
          this.loadStats();
          this.closeModals();
          this.showSuccessMessage('Transaction updated successfully');
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating transaction:', error);
          this.loading = false;
          this.handleError(error);
        }
      });
    }
  }

  createTransaction(): void {
    if (this.createForm.valid) {
      this.loading = true;
      this.adminService.createTransaction(this.createForm.value).subscribe({
        next: () => {
          this.loadTransactions();
          this.loadStats();
          this.closeModals();
          this.showSuccessMessage('Transaction created successfully');
          this.loading = false;
        },
        error: (error) => {
          console.error('Error creating transaction:', error);
          this.loading = false;
          this.handleError(error);
        }
      });
    }
  }

  openDeleteModal(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.showDeleteModal = true;
    this.showActionSheet = false;
  }

  deleteTransaction(): void {
    if (this.selectedTransaction) {
      this.loading = true;
      this.adminService.deleteTransaction(this.selectedTransaction.id).subscribe({
        next: () => {
          this.loadTransactions();
          this.loadStats();
          this.closeModals();
          this.showSuccessMessage('Transaction deleted successfully');
          this.loading = false;
        },
        error: (error) => {
          console.error('Error deleting transaction:', error);
          this.loading = false;
          this.handleError(error);
        }
      });
    }
  }

  closeModals(): void {
    this.showDetailModal = false;
    this.showUpdateModal = false;
    this.showDeleteModal = false;
    this.showCreateModal = false;
    this.showActionSheet = false;
    this.selectedTransaction = null;
    this.updateForm.reset();
    this.createForm.reset();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.selectedPaymentStatus = 'all';
    this.startDate = '';
    this.endDate = '';
    this.sortColumn = '';
    this.sortDirection = 'asc';
    this.loadTransactions();
  }

  getStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      case 'disputed': return 'status-disputed';
      default: return 'status-default';
    }
  }

  getStatusIcon(status: string): string {
    switch(status?.toLowerCase()) {
      case 'completed': return '✅';
      case 'approved': return '✓';
      case 'pending': return '⏳';
      case 'cancelled': return '❌';
      case 'disputed': return '⚠️';
      default: return '📌';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'completed': return 'payment-completed';
      case 'processing': return 'payment-processing';
      case 'pending': return 'payment-pending';
      case 'failed': return 'payment-failed';
      case 'refunded': return 'payment-refunded';
      default: return 'payment-default';
    }
  }

  getPaymentStatusIcon(status: string): string {
    switch(status?.toLowerCase()) {
      case 'completed': return '✅';
      case 'processing': return '🔄';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      case 'refunded': return '↩️';
      default: return '💳';
    }
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount || 0);
  }

  showSuccessMessage(message: string): void {
    alert(message);
  }

  handleError(error: any): void {
    let message = 'An error occurred';
    if (error.status === 401) {
      message = 'Session expired. Please login again.';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } else if (error.error?.message) {
      message = error.error.message;
    }
    alert(message);
  }
}