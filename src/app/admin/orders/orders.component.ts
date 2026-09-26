// admin/components/orders/orders.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../admin.service';
import { AdminAccess } from 'src/app/ui/admin-access';
import { notify } from 'src/app/shared/notify';
// import { AdminService } from '../../admin.service';

export interface AdminOrder {
  customer_user_id?: number | null;   // for revealing the masked phone
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
  status: 'awaiting_payment' | 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  down_payment_status?: 'unpaid' | 'paid';
  down_payment_reference?: string;
  down_payment_paid_at?: string;
  refund_status?: string | null;
  // Phase 6
  fraud_flags?: { id: number; code: string; severity: string; message: string }[];
  identity_verified_by?: string | null;
  employment_verified?: boolean;
  delivery_address: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
}

@Component({
  selector: 'app-admin-orders',
  templateUrl: './orders.component.html'
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
  activeTab: 'all' | 'awaiting_payment' | 'pending' | 'approved' | 'rejected' | 'completed' = 'pending';   // the queue opens on what needs a decision
  showOrderModal = false;
  showApproveModal = false;
  showRejectModal = false;
  
  // Search & Filters
  searchTerm = '';
  
  // Forms
  approveForm: FormGroup;
  rejectForm: FormGroup;
  
  // Counts for the whole queue, from the server (not just this page)
  counts: Record<string, number> = {};
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly tabs: { value: AdminOrdersComponent['activeTab']; label: string }[] = [
    { value: 'pending', label: 'Awaiting approval' },
    { value: 'awaiting_payment', label: 'Awaiting down payment' },
    { value: 'approved', label: 'Approved' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All' },
  ];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    public access: AdminAccess
  ) {
    access.load();
    this.approveForm = this.fb.group({
      admin_notes: [''],
      // Fill in only once the down payment has actually been received
      down_payment_reference: [''],
      down_payment_method: ['mobile_money']
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
        this.counts = response.counts || {};
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.orders = [];
        this.filteredOrders = [];
      }
    });
  }

  count(status: string): number {
    return this.counts[status] || 0;
  }

  planLabel(order: AdminOrder): string {
    const n = order.number_of_installments;
    return !n || n <= 1 ? 'Paid in full' : `Pay in ${n}`;
  }

  // ============================================
  // FILTER METHODS
  // ============================================

  filterByTab(tab: 'all' | 'awaiting_payment' | 'pending' | 'approved' | 'rejected' | 'completed'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.loadOrders();
  }

  onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.applyFilters(), 300);
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.activeTab = 'pending';
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
      admin_notes: this.approveForm.value.admin_notes || 'Order approved by admin',
      down_payment_reference: (this.approveForm.value.down_payment_reference || '').trim(),
      down_payment_method: this.approveForm.value.down_payment_method || 'mobile_money'
    };

    this.adminService.approveOrder(this.selectedOrder.id, data).subscribe({
      next: (response: any) => {
        this.isProcessing = false;
        this.showApproveModal = false;
        this.loadOrders();
        notify(response?.down_payment_status === 'paid'
          ? 'Order approved. Down payment recorded as received.'
          : 'Order approved. The down payment is awaiting verification in Instalments.');
      },
      error: (error) => {
        this.isProcessing = false;
        notify(error?.error?.error || error?.message || 'Failed to approve order. Please try again.', 'error');
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
      next: (response: any) => {
        this.isProcessing = false;
        this.showRejectModal = false;
        this.loadOrders();
        // The message says whether the down payment was refunded automatically
        notify(response?.message || 'Order rejected successfully!');
      },
      error: (error) => {
        this.isProcessing = false;
        notify(error?.error?.error || 'Failed to reject order. Please try again.', 'error');
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
        notify('Failed to export orders.', 'error');
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

  // ============================================
  // HELPER METHODS
  // ============================================

  getRefundLabel(refundStatus: string | null | undefined): string {
    switch (refundStatus) {
      case 'refunded': return 'Down payment refunded via Paystack';
      case 'refund_failed': return 'Refund failed: refund manually';
      case 'manual_refund_required': return 'Refund the down payment manually';
      case 'refund_required': return 'Paid after rejection: refund required';
      default: return '';
    }
  }
}
