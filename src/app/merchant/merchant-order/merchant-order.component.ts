// merchant/components/orders/orders.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MerchantService } from '../../merchant.service';

export interface MerchantOrder {
  id: number;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  product_name: string;
  product_price: number;
  quantity: number;
  total_payable: number;
  down_payment_amount: number;
  installment_amount: number;
  number_of_installments: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  delivery_address: string;
  delivery_status: string;
  created_at: string;
}

@Component({
  selector: 'app-merchant-orders',
  templateUrl: './merchant-order.component.html',
  styleUrls: ['./merchant-order.component.scss']
})
export class MerchantOrdersComponent implements OnInit {
  // Data
  orders: MerchantOrder[] = [];
  filteredOrders: MerchantOrder[] = [];
  selectedOrder: MerchantOrder | null = null;
  
  // UI State
  isLoading = true;
  isUpdating = false;
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;
  activeTab: 'all' | 'pending' | 'approved' | 'completed' = 'all';
  showOrderModal = false;
  showDeliveryModal = false;
  
  // Search & Filters
  searchTerm = '';
  selectedStatus = '';
  
  // Forms
  deliveryForm: FormGroup;
  
  // Stats
  stats = {
    total_orders: 0,
    pending_orders: 0,
    approved_orders: 0,
    completed_orders: 0,
    total_revenue: 0
  };
  
  // Status Options
  statusOptions = [
    { value: 'pending', label: 'Pending', icon: '⏳', color: '#ffc107' },
    { value: 'approved', label: 'Approved', icon: '✅', color: '#28a745' },
    { value: 'completed', label: 'Completed', icon: '🎉', color: '#17a2b8' },
    { value: 'rejected', label: 'Rejected', icon: '❌', color: '#dc3545' },
    { value: 'cancelled', label: 'Cancelled', icon: '🚫', color: '#6c757d' }
  ];
  
  deliveryStatusOptions = [
    { value: 'pending', label: 'Pending', icon: '⏳' },
    { value: 'processing', label: 'Processing', icon: '🔄' },
    { value: 'shipped', label: 'Shipped', icon: '🚚' },
    { value: 'delivered', label: 'Delivered', icon: '📦' }
  ];

  constructor(
    private merchantService: MerchantService,
    private fb: FormBuilder
  ) {
    this.deliveryForm = this.fb.group({
      delivery_status: ['', Validators.required],
      tracking_number: [''],
      notes: ['']
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
    
    this.merchantService.getMerchantOrders(filters).subscribe({
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
    this.stats.completed_orders = this.orders.filter(o => o.status === 'completed').length;
    this.stats.total_revenue = this.orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.total_payable, 0);
  }

  // ============================================
  // FILTER METHODS
  // ============================================

  filterByTab(tab: 'all' | 'pending' | 'approved' | 'completed'): void {
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

  viewOrderDetails(order: MerchantOrder): void {
    this.selectedOrder = order;
    this.showOrderModal = true;
  }

  openDeliveryModal(order: MerchantOrder): void {
    this.selectedOrder = order;
    this.deliveryForm.patchValue({
      delivery_status: order.delivery_status || 'pending',
      tracking_number: '',
      notes: ''
    });
    this.showDeliveryModal = true;
  }

  updateDeliveryStatus(): void {
    if (this.deliveryForm.invalid || !this.selectedOrder) return;
    
    this.isUpdating = true;
    
    const data = {
      delivery_status: this.deliveryForm.value.delivery_status,
      tracking_number: this.deliveryForm.value.tracking_number,
      notes: this.deliveryForm.value.notes
    };
    
    this.merchantService.updateOrderDelivery(this.selectedOrder.id, data).subscribe({
      next: (response) => {
        this.isUpdating = false;
        this.showDeliveryModal = false;
        this.loadOrders();
        alert('Delivery status updated successfully!');
      },
      error: (error) => {
        console.error('Error updating delivery:', error);
        this.isUpdating = false;
        alert('Failed to update delivery status.');
      }
    });
  }

  // ============================================
  // MODAL CONTROLS
  // ============================================

  closeModals(): void {
    this.showOrderModal = false;
    this.showDeliveryModal = false;
    this.selectedOrder = null;
    this.deliveryForm.reset();
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'completed': return 'status-completed';
      case 'rejected': return 'status-rejected';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'completed': return '🎉';
      case 'rejected': return '❌';
      case 'cancelled': return '🚫';
      default: return '📋';
    }
  }

  getDeliveryStatusClass(status: string): string {
    switch (status) {
      case 'delivered': return 'delivery-delivered';
      case 'shipped': return 'delivery-shipped';
      case 'processing': return 'delivery-processing';
      default: return 'delivery-pending';
    }
  }

  getDeliveryStatusIcon(status: string): string {
    switch (status) {
      case 'delivered': return '📦✅';
      case 'shipped': return '🚚';
      case 'processing': return '🔄';
      default: return '⏳';
    }
  }
}