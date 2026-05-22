// customer/components/orders/orders.component.ts
import { Component, OnInit } from '@angular/core';
import { CustomerService } from '../../customers.service';

export interface CustomerOrder {
  id: number;
  order_id: string;
  merchant_name: string;
  product_name: string;
  product_price: number;
  product_image: string;
  quantity: number;
  total_payable: number;
  down_payment_amount: number;
  installment_amount: number;
  number_of_installments: number;
  remaining_balance: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  payment_schedule: any[];
  delivery_address: string;
  delivery_status: string;
  created_at: string;
  approved_at: string;
  completed_at: string;
  admin_notes: string;
}

@Component({
  selector: 'app-customer-orders',
  templateUrl: './customer-order.component.html',
  styleUrls: ['./customer-order.component.scss']
})
export class CustomerOrdersComponent implements OnInit {
  orders: CustomerOrder[] = [];
  filteredOrders: CustomerOrder[] = [];
  selectedOrder: CustomerOrder | null = null;
  isLoading = true;
  activeTab: 'all' | 'pending' | 'approved' | 'completed' = 'all';
  showOrderModal = false;

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadOrders(): void {
    this.isLoading = true;
    this.customerService.getCustomerOrders().subscribe({
      next: (response: any) => {
        this.orders = response;
        this.applyFilter();
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

  // ============================================
  // FILTER METHODS
  // ============================================

  applyFilter(): void {
    if (this.activeTab === 'all') {
      this.filteredOrders = this.orders;
    } else {
      this.filteredOrders = this.orders.filter(o => o.status === this.activeTab);
    }
  }

  filterByTab(tab: 'all' | 'pending' | 'approved' | 'completed'): void {
    this.activeTab = tab;
    this.applyFilter();
  }

  getPendingCount(): number {
    return this.orders.filter(o => o.status === 'pending').length;
  }

  // ============================================
  // ORDER ACTIONS
  // ============================================

  viewOrderDetails(order: CustomerOrder): void {
    this.selectedOrder = order;
    this.showOrderModal = true;
  }

  trackOrder(order: CustomerOrder): void {
    // Open Google Maps with delivery address
    const address = encodeURIComponent(order.delivery_address);
    window.open(`https://www.google.com/maps/search/${address}`, '_blank');
  }

  cancelOrder(order: CustomerOrder): void {
    if (confirm(`Are you sure you want to cancel order ${order.order_id}?`)) {
      this.customerService.cancelOrder(order.id).subscribe({
        next: (response) => {
          this.loadOrders();
          alert('Order cancelled successfully');
        },
        error: (error) => {
          console.error('Error cancelling order:', error);
          alert('Failed to cancel order. Please try again.');
        }
      });
    }
  }

  closeModal(): void {
    this.showOrderModal = false;
    this.selectedOrder = null;
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
      case 'cancelled': return '🚫';
      default: return '📋';
    }
  }

  getDeliveryStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'delivered': return '📦✅';
      case 'shipped': return '🚚';
      case 'processing': return '🔄';
      case 'pending': return '⏳';
      default: return '📦';
    }
  }
}