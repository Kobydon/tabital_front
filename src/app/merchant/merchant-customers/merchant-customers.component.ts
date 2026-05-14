import { Component, OnInit } from '@angular/core';
// import { MerchantService } from '../services/merchant.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MerchantService } from 'src/app/merchant.service';

// Define interfaces for type safety
interface Customer {
  id: number;
  customer_id: string;
  full_name: string;
  business_name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  status: string;
  kyc_status: string;
  total_spent: number;
  total_transactions: number;
  completed_transactions: number;
  active_instalments: number;
  last_transaction: string;
  created_at: string;
  is_active: boolean;
  designation?: string;
  company?: string;
  income_range?: string;
  gps?: string;
  recent_transactions?: any[];
}

interface TopCustomer {
  id: number;
  name: string;
  total_spent: number;
  transaction_count: number;
}

interface CustomerStats {
  total_customers: number;
  active_customers: number;
  new_customers: number;
  returning_customers: number;
  one_time_customers: number;
  total_spent: number;
  average_spent: number;
  customers_with_instalments: number;
  top_customers: TopCustomer[];
}

@Component({
  selector: 'app-merchant-customers',
  templateUrl: './merchant-customers.component.html',
  styleUrls: ['./merchant-customers.component.scss']
})
export class MerchantCustomersComponent implements OnInit {
  isLoading = false;
  customers: Customer[] = [];
  selectedCustomer: Customer | null = null;
  
  // Filters
  searchTerm = '';
  selectedStatus = 'all';
  currentPage = 1;
  itemsPerPage = 20;
  totalItems = 0;
  totalPages = 0;
  
  // Stats
  stats: CustomerStats = {
    total_customers: 0,
    active_customers: 0,
    new_customers: 0,
    returning_customers: 0,
    one_time_customers: 0,
    total_spent: 0,
    average_spent: 0,
    customers_with_instalments: 0,
    top_customers: []
  };
  
  // Modal states
  showDetailsModal = false;
  showEditModal = false;
  
  // Forms
  editForm: FormGroup;
  
  // Sort options
  sortBy = 'created_at';
  sortOrder = 'desc';
  
  sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'created_at', label: 'Member Since' },
    { value: 'total_spent', label: 'Total Spent' }
  ];

  constructor(
    private merchantService: MerchantService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      full_name: ['', Validators.required],
      business_name: [''],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
      email: ['', Validators.email],
      city: [''],
      address: [''],
      designation: [''],
      company: [''],
      income_range: [''],
      status: ['active']
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadStats();
  }

  loadCustomers() {
    this.isLoading = true;
    const filters: any = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sort_by: this.sortBy,
      sort_order: this.sortOrder
    };
    
    if (this.selectedStatus !== 'all') filters.status = this.selectedStatus;
    if (this.searchTerm) filters.search = this.searchTerm;
    
    this.merchantService.getMerchantCustomers(filters).subscribe({
      next: (response: any) => {
        this.customers = response.customers || [];
        this.totalItems = response.total || 0;
        this.totalPages = response.total_pages || 0;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading customers:', error);
        this.isLoading = false;
      }
    });
  }

  loadStats() {
    this.merchantService.getCustomerStats().subscribe({
      next: (data: CustomerStats) => {
        this.stats = data;
      },
      error: (error: any) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadCustomers();
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.sortBy = 'created_at';
    this.sortOrder = 'desc';
    this.currentPage = 1;
    this.loadCustomers();
  }

  changePage(page: number) {
    this.currentPage = page;
    this.loadCustomers();
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

  viewCustomerDetails(customer: Customer) {
    this.merchantService.getCustomerDetails(customer.id).subscribe({
      next: (data: Customer) => {
        this.selectedCustomer = data;
        this.showDetailsModal = true;
      },
      error: (error: any) => {
        console.error('Error loading customer details:', error);
        alert('Failed to load customer details');
      }
    });
  }

  openEditModal(customer: Customer) {
    this.selectedCustomer = customer;
    this.editForm.patchValue({
      full_name: customer.full_name,
      business_name: customer.business_name,
      phone: customer.phone,
      email: customer.email,
      city: customer.city,
      address: customer.address,
      designation: customer.designation,
      company: customer.company,
      income_range: customer.income_range,
      status: customer.status
    });
    this.showEditModal = true;
  }

  updateCustomer() {
    if (this.editForm.valid && this.selectedCustomer) {
      this.merchantService.updateCustomer(this.selectedCustomer.id, this.editForm.value).subscribe({
        next: () => {
          this.loadCustomers();
          this.loadStats();
          this.showEditModal = false;
          alert('Customer updated successfully');
        },
        error: (error: any) => {
          console.error('Error updating customer:', error);
          alert('Failed to update customer');
        }
      });
    }
  }

  exportCustomers() {
    this.merchantService.exportCustomers().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        alert('Export started');
      },
      error: (error: any) => {
        console.error('Error exporting customers:', error);
        alert('Failed to export customers');
      }
    });
  }

  onSortChange() {
    this.currentPage = 1;
    this.loadCustomers();
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
      day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'pending': return 'status-pending';
      default: return 'status-default';
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'active': return '✅';
      case 'inactive': return '⭕';
      case 'pending': return '⏳';
      default: return '📌';
    }
  }

  getKycStatusClass(status: string): string {
    switch(status) {
      case 'verified': return 'kyc-verified';
      case 'pending': return 'kyc-pending';
      case 'rejected': return 'kyc-rejected';
      default: return 'kyc-default';
    }
  }

  closeModals() {
    this.showDetailsModal = false;
    this.showEditModal = false;
    this.editForm.reset();
  }
}