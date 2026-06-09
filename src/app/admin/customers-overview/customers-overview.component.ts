import { Component, OnInit, OnDestroy } from '@angular/core';
// import { AdminService } from '../../admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../admin.service';

interface Customer {
  id: number;
  customer_id: string;
  full_name: string;
  phone: string;
  business_email: string;
  kyc_status: string;
  risk_level: string;
  credit_limit: number;
  outstanding: number;
  status: string;
  total_financed?: number;
  total_paid?: number;
  active_plans?: number;
}

@Component({
  selector: 'app-customers-overview',
  templateUrl: './customers-overview.component.html',
  styleUrls: ['./customers-overview.component.scss']
})
export class CustomersOverviewComponent implements OnInit, OnDestroy {
  // Data
  customers: Customer[] = [];
  selectedCustomer: any = null;
  customerStats: any = {};
  
  // UI State
  isLoading = true;
  showCustomerModal = false;
  showUpdateStatusModal = false;
  showUpdateLimitModal = false;
  showAddNoteModal = false;
  isSubmitting = false;
  
  // Filters
  searchTerm = '';
  selectedKYCStatus = '';
  selectedRiskLevel = '';
  selectedCustomerStatus = '';
  sortBy = 'created_at';
  sortOrder = 'desc';
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 1;
  
  // Forms
  updateStatusForm: FormGroup;
  updateLimitForm: FormGroup;
  addNoteForm: FormGroup;
  
  // Math for template
  Math = Math;
  
  // Stats Cards
  statsCards = [
    { label: 'Total Customers', value: 0, icon: 'fa-users', color: 'blue', suffix: '', growth: 0 },
    { label: 'Active Customers', value: 0, icon: 'fa-user-check', color: 'green', suffix: '', growth: 0 },
    { label: 'New Customers (30 Days)', value: 0, icon: 'fa-user-plus', color: 'purple', suffix: '', growth: 0 },
    { label: 'Repeat Purchase Rate', value: 0, icon: 'fa-sync-alt', color: 'orange', suffix: '%', growth: 0 },
    { label: 'Total Outstanding', value: 0, icon: 'fa-money-bill-wave', color: 'red', suffix: '', growth: 0 }
  ];

  // KYC Status Options
  kycStatusOptions = [
    { value: '', label: 'All' },
    { value: 'verified', label: 'Verified' },
    { value: 'pending', label: 'Pending' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // Risk Level Options
  riskLevelOptions = [
    { value: '', label: 'All' },
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' }
  ];

  // Customer Status Options
  customerStatusOptions = [
    { value: '', label: 'All' },
    { value: 'approved', label: 'Approved' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'suspended', label: 'Suspended' }
  ];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.updateStatusForm = this.fb.group({
      status: ['', Validators.required],
      reason: ['']
    });
    
    this.updateLimitForm = this.fb.group({
      credit_limit: ['', [Validators.required, Validators.min(100)]],
      reason: ['']
    });
    
    this.addNoteForm = this.fb.group({
      note: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadCustomerStats();
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadCustomerStats(): void {
    this.adminService.getCustomerStats().subscribe({
      next: (response: any) => {
        console.log('Customer stats:', response);
        this.customerStats = response;
        this.updateStatsCards();
      },
      error: (error) => {
        console.error('Error loading customer stats:', error);
      }
    });
  }

  updateStatsCards(): void {
    this.statsCards[0].value = this.customerStats.total_customers || 0;
    this.statsCards[1].value = this.customerStats.active_customers || 0;
    this.statsCards[1].growth = this.customerStats.active_customers_growth || 0;
    this.statsCards[2].value = this.customerStats.new_customers || 0;
    this.statsCards[2].growth = this.customerStats.new_customers_growth || 0;
    this.statsCards[3].value = this.customerStats.repeat_purchase_rate || 0;
    this.statsCards[3].growth = this.customerStats.repeat_purchase_rate_growth || 0;
    this.statsCards[4].value = this.customerStats.total_outstanding || 0;
    this.statsCards[4].growth = this.customerStats.outstanding_growth || 0;
  }

  loadCustomers(): void {
    this.isLoading = true;
    
    const filters: any = {
      page: this.currentPage,
      per_page: this.pageSize,
      search: this.searchTerm,
      kyc_status: this.selectedKYCStatus,
      status: this.selectedCustomerStatus,
      sort_by: this.sortBy,
      sort_order: this.sortOrder
    };
    
    console.log('Loading customers with filters:', filters);
    
    this.adminService.getAllCustomers(filters).subscribe({
      next: (response: any) => {
        console.log('Customers response:', response);
        // Handle both array response and paginated response
        if (Array.isArray(response)) {
          this.customers = response;
          this.totalItems = response.length;
          this.totalPages = 1;
        } else {
          this.customers = response.customers || [];
          this.totalItems = response.total || 0;
          this.totalPages = response.total_pages || 1;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.isLoading = false;
      }
    });
  }

  // ============================================
  // CUSTOMER DETAILS
  // ============================================

  viewCustomerDetails(customer: Customer): void {
    this.adminService.getCustomerDetail(customer.id).subscribe({
      next: (response: any) => {
        this.selectedCustomer = response;
        this.showCustomerModal = true;
      },
      error: (error) => {
        console.error('Error loading customer details:', error);
        alert('Failed to load customer details');
      }
    });
  }

  // ============================================
  // CUSTOMER ACTIONS
  // ============================================

  openUpdateStatusModal(customer: Customer): void {
    this.selectedCustomer = { customer };
    this.updateStatusForm.patchValue({ status: customer.status, reason: '' });
    this.showUpdateStatusModal = true;
  }

  updateCustomerStatus(): void {
    if (this.updateStatusForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.updateStatusForm.value;
    
    this.adminService.updateCustomerStatus(this.selectedCustomer.customer.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Customer status updated successfully');
        this.showUpdateStatusModal = false;
        this.loadCustomers();
        this.loadCustomerStats();
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.isSubmitting = false;
        alert('Failed to update status');
      }
    });
  }

  openUpdateLimitModal(customer: Customer): void {
    this.selectedCustomer = { customer };
    this.updateLimitForm.patchValue({ credit_limit: customer.credit_limit, reason: '' });
    this.showUpdateLimitModal = true;
  }

  updateCreditLimit(): void {
    if (this.updateLimitForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.updateLimitForm.value;
    
    this.adminService.updateCustomerCreditLimit(this.selectedCustomer.customer.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Credit limit updated successfully');
        this.showUpdateLimitModal = false;
        this.loadCustomers();
      },
      error: (error) => {
        console.error('Error updating credit limit:', error);
        this.isSubmitting = false;
        alert('Failed to update credit limit');
      }
    });
  }

  openAddNoteModal(customer: Customer): void {
    this.selectedCustomer = { customer };
    this.addNoteForm.reset();
    this.showAddNoteModal = true;
  }

  addCustomerNote(): void {
    if (this.addNoteForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.addNoteForm.value;
    
    this.adminService.addCustomerNote(this.selectedCustomer.customer.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Note added successfully');
        this.showAddNoteModal = false;
      },
      error: (error) => {
        console.error('Error adding note:', error);
        this.isSubmitting = false;
        alert('Failed to add note');
      }
    });
  }

  exportCustomers(): void {
    const filters: any = {
      search: this.searchTerm,
      kyc_status: this.selectedKYCStatus,
      status: this.selectedCustomerStatus,
      sort_by: this.sortBy,
      sort_order: this.sortOrder
    };
    
    this.adminService.exportCustomers(filters).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        alert('Customers exported successfully!');
      },
      error: (error) => {
        console.error('Error exporting customers:', error);
        alert('Failed to export customers');
      }
    });
  }

  // ============================================
  // FILTERS & SORTING
  // ============================================

  applyFilters(): void {
    this.currentPage = 1;
    this.loadCustomers();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedKYCStatus = '';
    this.selectedRiskLevel = '';
    this.selectedCustomerStatus = '';
    this.sortBy = 'created_at';
    this.sortOrder = 'desc';
    this.currentPage = 1;
    this.loadCustomers();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'desc';
    }
    this.loadCustomers();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadCustomers();
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

  getRiskClass(riskLevel: string): string {
    switch(riskLevel?.toLowerCase()) {
      case 'low': return 'risk-low';
      case 'medium': return 'risk-medium';
      case 'high': return 'risk-high';
      default: return '';
    }
  }

  getKYCStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'verified': return 'kyc-verified';
      case 'pending': return 'kyc-pending';
      case 'rejected': return 'kyc-rejected';
      default: return '';
    }
  }

  getStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'approved':
      case 'active': return 'status-active';
      case 'pending': return 'status-pending';
      case 'suspended': return 'status-suspended';
      default: return '';
    }
  }

  getTrendClass(growth: number): string {
    if (growth > 0) return 'trend-up';
    if (growth < 0) return 'trend-down';
    return 'trend-neutral';
  }

  getTrendIcon(growth: number): string {
    if (growth > 0) return '↑';
    if (growth < 0) return '↓';
    return '→';
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

  closeModals(): void {
    this.showCustomerModal = false;
    this.showUpdateStatusModal = false;
    this.showUpdateLimitModal = false;
    this.showAddNoteModal = false;
    this.selectedCustomer = null;
    this.isSubmitting = false;
  }
}