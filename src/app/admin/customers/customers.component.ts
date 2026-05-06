import { Component, OnInit, HostListener } from '@angular/core';
import { AdminService } from '../admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

export interface Customer {
  id: number;
  customer_id: string;
  phone: string;
  role: string;
  business_name: string | null;
  full_name: string | null;
  national_id: string | null;
  city: string | null;
  income_range: string | null;
  status: string;
  created_at: string;
  payment_plan: string | null;
  ref_name: string | null;
  ref_phone: string | null;
  ref_relationship: string | null;
  gps: string | null;
  address: string | null;
  agree: boolean;
  joinDate?: string;
  email?: string;
  totalOrders?: number;
  totalSpent?: number;
}

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit {
  // Data properties
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  selectedCustomer: Customer | null = null;
  
  // UI state
  loading = false;
  searchTerm = '';
  selectedStatus = 'all';
  currentPage = 1;
  itemsPerPage = 10;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Modal states
  showDetailModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showActionSheet = false;
  
  // Touch properties
  touchStartX = 0;
  touchEndX = 0;
  
  // Edit form
  editForm: FormGroup;
  
  // Screen size detection
  isMobile = false;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.editForm = this.createEditForm();
  }

  ngOnInit(): void {
    this.checkScreenSize();
    this.loadCustomers();
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
  }

  createEditForm(): FormGroup {
    return this.fb.group({
      full_name: ['', Validators.required],
      business_name: [''],
      phone: ['', [Validators.required, Validators.pattern('^[0-9+()\\s-]+$')]],
      email: ['', [Validators.email]],
      city: [''],
      address: [''],
      status: ['active', Validators.required],
      payment_plan: [''],
      income_range: [''],
      role: ['customer']
    });
  }

  loadCustomers() {
    this.loading = true;
    this.adminService.getCustomers().subscribe({
      next: (data: any[]) => {
        console.log('Customers data from API:', data);
        this.customers = data.map(customer => ({
          ...customer,
          customer_id: customer.customer_id || '',
          joinDate: customer.created_at,
          email: this.generateEmail(customer),
          totalOrders: 0,
          totalSpent: 0
        }));
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.loading = false;
        this.handleError(error);
      }
    });
  }

  generateEmail(customer: Customer): string {
    if (customer.full_name) {
      return customer.full_name.toLowerCase().replace(/\s/g, '.') + '@example.com';
    }
    if (customer.business_name) {
      return customer.business_name.toLowerCase().replace(/\s/g, '.') + '@example.com';
    }
    return customer.phone + '@example.com';
  }

  getShortAddress(address: string | null | undefined): string {
    if (!address) return 'N/A';
    return address.length > 30 ? address.substring(0, 30) + '...' : address;
  }

  getAvatarGradient(id: number): string {
    const color1 = this.getColor(id);
    const color2 = this.getColor(id + 5);
    return `linear-gradient(135deg, ${color1}, ${color2})`;
  }

  applyFilters() {
    let filtered = [...this.customers];
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(customer => 
        (customer.customer_id && customer.customer_id.toLowerCase().includes(term)) ||
        (customer.full_name && customer.full_name.toLowerCase().includes(term)) ||
        (customer.business_name && customer.business_name.toLowerCase().includes(term)) ||
        customer.phone.includes(term) ||
        this.generateEmail(customer).toLowerCase().includes(term) ||
        (customer.city && customer.city.toLowerCase().includes(term))
      );
    }
    
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(customer => 
        customer.status.toLowerCase() === this.selectedStatus.toLowerCase()
      );
    }
    
    if (this.sortColumn) {
      filtered.sort((a, b) => {
        let aVal: any;
        let bVal: any;
        
        switch(this.sortColumn) {
          case 'customer_id':
            aVal = a.customer_id;
            bVal = b.customer_id;
            break;
          case 'full_name':
            aVal = a.full_name || a.business_name;
            bVal = b.full_name || b.business_name;
            break;
          case 'phone':
            aVal = a.phone;
            bVal = b.phone;
            break;
          case 'city':
            aVal = a.city;
            bVal = b.city;
            break;
          case 'status':
            aVal = a.status;
            bVal = b.status;
            break;
          case 'payment_plan':
            aVal = a.payment_plan;
            bVal = b.payment_plan;
            break;
          case 'income_range':
            aVal = a.income_range;
            bVal = b.income_range;
            break;
          case 'ref_name':
            aVal = a.ref_name;
            bVal = b.ref_name;
            break;
          case 'ref_phone':
            aVal = a.ref_phone;
            bVal = b.ref_phone;
            break;
          case 'created_at':
            aVal = a.created_at;
            bVal = b.created_at;
            break;
          default:
            aVal = a[this.sortColumn as keyof Customer];
            bVal = b[this.sortColumn as keyof Customer];
        }
        
        let comparison = 0;
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }
        
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    this.filteredCustomers = filtered;
    this.currentPage = 1;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onStatusChange(status: string) {
    this.selectedStatus = status;
    this.applyFilters();
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
    if (this.sortColumn !== columnName) {
      return '↕️';
    }
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  get paginatedCustomers(): Customer[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCustomers.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCustomers.length / this.itemsPerPage);
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

  getColor(id: number): string {
    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#4facfe', 
      '#43e97b', '#fa709a', '#fee140', '#30cfd0',
      '#a8edea', '#fed6e3', '#ff9a9e', '#a18cd1'
    ];
    return colors[id % colors.length];
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent, customer: Customer): void {
    this.touchEndX = event.changedTouches[0].clientX;
    const swipeDistance = this.touchEndX - this.touchStartX;
    
    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance > 0) {
        this.onSwipeRight(customer);
      } else {
        this.onSwipeLeft(customer);
      }
    }
  }

  onSwipeLeft(customer: Customer): void {
    this.selectedCustomer = customer;
    this.showActionSheet = true;
  }

  onSwipeRight(customer: Customer): void {
    this.viewCustomerDetails(customer);
  }

  viewCustomerDetails(customer: Customer): void {
    this.selectedCustomer = customer;
    this.showDetailModal = true;
    this.showActionSheet = false;
  }

  openEditModal(customer: Customer): void {
    this.selectedCustomer = customer;
    this.editForm.patchValue({
      full_name: customer.full_name,
      business_name: customer.business_name,
      phone: customer.phone,
      email: this.generateEmail(customer),
      city: customer.city,
      address: customer.address,
      status: customer.status,
      payment_plan: customer.payment_plan,
      income_range: customer.income_range,
      role: customer.role
    });
    this.showEditModal = true;
    this.showDetailModal = false;
    this.showActionSheet = false;
  }

  updateCustomer(): void {
    if (this.editForm.valid && this.selectedCustomer) {
      this.loading = true;
      const updatedData = { ...this.selectedCustomer, ...this.editForm.value };
      
      this.adminService.updateCustomer(this.selectedCustomer.id, updatedData).subscribe({
        next: (response) => {
          const index = this.customers.findIndex(c => c.id === this.selectedCustomer!.id);
          if (index !== -1) {
            this.customers[index] = { ...this.customers[index], ...this.editForm.value };
            this.applyFilters();
          }
          this.closeModals();
          this.showSuccessMessage('Customer updated successfully');
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating customer:', error);
          this.loading = false;
          this.handleError(error);
        }
      });
    }
  }

  openDeleteModal(customer: Customer): void {
    this.selectedCustomer = customer;
    this.showDeleteModal = true;
    this.showActionSheet = false;
  }

  deleteCustomer(): void {
    if (this.selectedCustomer) {
      this.loading = true;
      this.adminService.deleteCustomer(this.selectedCustomer.id).subscribe({
        next: () => {
          this.customers = this.customers.filter(c => c.id !== this.selectedCustomer!.id);
          this.applyFilters();
          this.closeModals();
          this.showSuccessMessage('Customer deleted successfully');
          this.loading = false;
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          this.loading = false;
          this.handleError(error);
        }
      });
    }
  }

  closeModals(): void {
    this.showDetailModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showActionSheet = false;
    this.selectedCustomer = null;
    this.editForm.reset();
  }

  getStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'active': return 'status-active';
      case 'approved': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      default: return 'status-default';
    }
  }

  getStatusIcon(status: string): string {
    switch(status?.toLowerCase()) {
      case 'active': return '✅';
      case 'approved': return '✅';
      case 'inactive': return '⭕';
      case 'pending': return '⏳';
      case 'rejected': return '❌';
      default: return '📌';
    }
  }

  getInitials(name: string | null): string {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  getDisplayName(customer: Customer): string {
    return customer.business_name || customer.full_name || customer.phone;
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.sortColumn = '';
    this.sortDirection = 'asc';
    this.applyFilters();
  }

  exportToCSV(): void {
    const headers = ['ID', 'Customer ID', 'Full Name', 'Business', 'Phone', 'City', 'Status', 'Payment Plan', 'Income Range', 'Join Date'];
    const csvData = this.filteredCustomers.map(c => [
      c.id,
      c.customer_id || '',
      c.full_name || '',
      c.business_name || '',
      c.phone,
      c.city || '',
      c.status,
      c.payment_plan || '',
      c.income_range || '',
      this.formatDate(c.created_at)
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  showSuccessMessage(message: string): void {
    alert(message);
  }

  handleError(error: any): void {
    let message = 'An error occurred';
    if (error.status === 401) {
      message = 'Session expired. Please login again.';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } else if (error.status === 403) {
      message = 'You do not have permission to perform this action.';
    } else if (error.error?.message) {
      message = error.error.message;
    }
    alert(message);
  }
}