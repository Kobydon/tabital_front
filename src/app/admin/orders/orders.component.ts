// admin/components/orders/orders.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../admin.service';
// import { AdminService } from '../../admin.service';

export interface AdminOrder {
  id: number;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  merchant_name: string;
  product_name: string;
  product_price: number;
  quantity: number;
  total_payable: number;
  down_payment_amount: number;
  installment_amount: number;
  number_of_installments: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  delivery_address: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
}

@Component({
  selector: 'app-admin-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class AdminOrdersComponent implements OnInit {
  // Data
  orders: AdminOrder[] = [];
  filteredOrders: AdminOrder[] = [];
  selectedOrder: AdminOrder | null = null;
  
  // UI State
  isLoading = true;
  isProcessing = false;
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;
  activeTab: 'all' | 'pending' | 'approved' | 'rejected' | 'completed' = 'all';
  showOrderModal = false;
  showApproveModal = false;
  showRejectModal = false;
  
  // Search & Filters
  searchTerm = '';
  
  // Forms
  approveForm: FormGroup;
  rejectForm: FormGroup;
  
  // Stats
  stats = {
    total_orders: 0,
    pending_orders: 0,
    approved_orders: 0,
    rejected_orders: 0,
    completed_orders: 0,
    total_revenue: 0
  };
  
  // Status Options
  statusOptions = [
    { value: 'pending', label: 'Pending', icon: '⏳', color: '#ffc107' },
    { value: 'approved', label: 'Approved', icon: '✅', color: '#28a745' },
    { value: 'rejected', label: 'Rejected', icon: '❌', color: '#dc3545' },
    { value: 'completed', label: 'Completed', icon: '🎉', color: '#17a2b8' }
  ];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.approveForm = this.fb.group({
      admin_notes: ['']
    });
    
    this.rejectForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadOrders(): void {
    this.isLoading = true;
    
    const filters: any = {
      page: this.currentPage,
      limit: this.pageSize,
      status: this.activeTab !== 'all' ? this.activeTab : '',
      search: this.searchTerm
    };
    
    this.adminService.getAdminOrders(filters).subscribe({
      next: (response: any) => {
        this.orders = response.orders || [];
        this.filteredOrders = this.orders;
        this.totalItems = response.total || 0;
        this.totalPages = response.total_pages || 1;
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.isLoading = false;
        this.orders = [];
        this.filteredOrders = [];
      }
    });
  }

  calculateStats(): void {
    this.stats.total_orders = this.orders.length;
    this.stats.pending_orders = this.orders.filter(o => o.status === 'pending').length;
    this.stats.approved_orders = this.orders.filter(o => o.status === 'approved').length;
    this.stats.rejected_orders = this.orders.filter(o => o.status === 'rejected').length;
    this.stats.completed_orders = this.orders.filter(o => o.status === 'completed').length;
    this.stats.total_revenue = this.orders
      .filter(o => o.status === 'approved' || o.status === 'completed')
      .reduce((sum, o) => sum + o.total_payable, 0);
  }

  // ============================================
  // FILTER METHODS
  // ============================================

  filterByTab(tab: 'all' | 'pending' | 'approved' | 'rejected' | 'completed'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.loadOrders();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.activeTab = 'all';
    this.currentPage = 1;
    this.loadOrders();
  }

  // ============================================
  // ORDER ACTIONS
  // ============================================

  viewOrderDetails(order: AdminOrder): void {
    this.selectedOrder = order;
    this.showOrderModal = true;
  }

  openApproveModal(order: AdminOrder): void {
    this.selectedOrder = order;
    this.approveForm.reset();
    this.showApproveModal = true;
  }

  openRejectModal(order: AdminOrder): void {
    this.selectedOrder = order;
    this.rejectForm.reset();
    this.showRejectModal = true;
  }

  approveOrder(): void {
    if (!this.selectedOrder) return;
    
    this.isProcessing = true;
    
    const data = {
      admin_notes: this.approveForm.value.admin_notes || 'Order approved by admin'
    };
    
    this.adminService.approveOrder(this.selectedOrder.id, data).subscribe({
      next: (response) => {
        this.isProcessing = false;
        this.showApproveModal = false;
        this.loadOrders();
        alert('Order approved successfully!');
      },
      error: (error) => {
        console.error('Error approving order:', error);
        this.isProcessing = false;
        alert('Failed to approve order. Please try again.');
      }
    });
  }

  rejectOrder(): void {
    if (this.rejectForm.invalid || !this.selectedOrder) return;
    
    this.isProcessing = true;
    
    const data = {
      reason: this.rejectForm.value.reason
    };
    
    this.adminService.rejectOrder(this.selectedOrder.id, data).subscribe({
      next: (response) => {
        this.isProcessing = false;
        this.showRejectModal = false;
        this.loadOrders();
        alert('Order rejected successfully!');
      },
      error: (error) => {
        console.error('Error rejecting order:', error);
        this.isProcessing = false;
        alert('Failed to reject order. Please try again.');
      }
    });
  }

  // ============================================
  // MODAL CONTROLS
  // ============================================

  closeModals(): void {
    this.showOrderModal = false;
    this.showApproveModal = false;
    this.showRejectModal = false;
    this.selectedOrder = null;
    this.approveForm.reset();
    this.rejectForm.reset();
  }

  // ============================================
  // EXPORT
  // ============================================

  exportOrders(): void {
    this.adminService.exportAdminOrders().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting orders:', error);
        alert('Failed to export orders.');
      }
    });
  }

  // ============================================
  // PAGINATION
  // ============================================

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadOrders();
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'completed': return '🎉';
      default: return '📋';
    }
  }
}