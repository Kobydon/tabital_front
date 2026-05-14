import { Component, OnInit, HostListener } from '@angular/core';
import { AdminService } from '../admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

export interface Merchant {
  id: number;
  merchant_id: string;
  phone: string;
  role: string;
  business_name: string;
  owner_name: string;
  full_name: string;
  national_id: string;
  city: string;
  income_range: string;
  status: string;
  created_at: string;
  payment_plan: string;
  product_type: string;
  has_shop: string;
  shop_url: string;
  years_in_business: string;
  offers_credit: string;
  price_range: string;
  payment_method: string;
  momo_name: string;
  momo_number: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  business_type: string;
  registration_number: string;
  tax_id: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  website: string;
  description: string;
  total_products: number;
  total_sales: number;
  rating: number;
  verified: boolean;
  address: string;
  gps: string;
  agree: boolean;
  joinDate?: string;
  email?: string;
}

@Component({
  selector: 'app-merchants',
  templateUrl: './merchants.component.html',
  styleUrls: ['./merchants.component.scss']
})
export class MerchantsComponent implements OnInit {
  // Data properties
  merchants: Merchant[] = [];
  filteredMerchants: Merchant[] = [];
  selectedMerchant: Merchant | null = null;
  
  // UI state
  loading = false;
  searchTerm = '';
  selectedStatus = 'all';
  selectedBusinessType = 'all';
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

  // Business type options
  businessTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'retail', label: 'Retail' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'distributor', label: 'Distributor' },
    { value: 'service', label: 'Service Provider' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'restaurant', label: 'Restaurant' }
  ];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.editForm = this.createEditForm();
  }

  ngOnInit(): void {
    this.checkScreenSize();
    this.loadMerchants();
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
      owner_name: ['', Validators.required],
      business_name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9+()\\s-]+$')]],
      city: [''],
      address: [''],
      status: ['active', Validators.required],
      payment_plan: [''],
      income_range: [''],
      business_type: [''],
      registration_number: [''],
      tax_id: [''],
      business_address: [''],
      business_phone: [''],
      business_email: ['', [Validators.email]],
      website: [''],
      description: [''],
      verified: [false],
      product_type: [''],
      has_shop: [''],
      shop_url: [''],
      years_in_business: [''],
      offers_credit: [''],
      price_range: [''],
      payment_method: [''],
      momo_name: [''],
      momo_number: [''],
      bank_name: [''],
      account_name: [''],
      account_number: ['']
    });
  }

  loadMerchants() {
    this.loading = true;
    this.adminService.getMerchants().subscribe({
      next: (data: any[]) => {
        console.log('Merchants data from API:', data);
        this.merchants = data.map((merchant: any) => ({
          id: merchant.id,
          merchant_id: merchant.merchant_id || '',
          phone: merchant.phone || '',
          role: merchant.role || 'merchant',
          business_name: merchant.business_name || '',
          owner_name: merchant.owner_name || '',
          full_name: merchant.full_name || '',
          national_id: merchant.national_id || '',
          city: merchant.city || '',
          income_range: merchant.income_range || '',
          status: merchant.status || 'pending',
          created_at: merchant.created_at || '',
          payment_plan: merchant.payment_plan || '',
          product_type: merchant.product_type || '',
          has_shop: merchant.has_shop || '',
          shop_url: merchant.shop_url || '',
          years_in_business: merchant.years_in_business || '',
          offers_credit: merchant.offers_credit || '',
          price_range: merchant.price_range || '',
          payment_method: merchant.payment_method || '',
          momo_name: merchant.momo_name || '',
          momo_number: merchant.momo_number || '',
          bank_name: merchant.bank_name || '',
            account_name: merchant.account_name || '',
          account_number: merchant.account_number || '',
          business_type: merchant.business_type || '',
          registration_number: merchant.registration_number || '',
          tax_id: merchant.tax_id || '',
          business_address: merchant.business_address || '',
          business_phone: merchant.business_phone || '',
          business_email: merchant.business_email || '',
          website: merchant.website || '',
          description: merchant.description || '',
          total_products: merchant.total_products || 0,
          total_sales: merchant.total_sales || 0,
          rating: merchant.rating || 0,
          verified: merchant.verified || false,
          address: merchant.address || '',
          gps: merchant.gps || '',
          agree: merchant.agree || false,
          joinDate: merchant.created_at,
          email: this.generateEmail(merchant)
        })) as Merchant[];
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading merchants:', error);
        this.loading = false;
        this.handleError(error);
      }
    });
  }

  generateEmail(merchant: any): string {
    if (merchant.business_email) {
      return merchant.business_email;
    }
    if (merchant.business_name) {
      return merchant.business_name.toLowerCase().replace(/\s/g, '.') + '@business.com';
    }
    return merchant.phone + '@business.com';
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

  formatBusinessType(businessType: string): string {
    if (!businessType) return 'Not specified';
    const types: { [key: string]: string } = {
      'retail': 'Retail',
      'wholesale': 'Wholesale',
      'manufacturer': 'Manufacturer',
      'distributor': 'Distributor',
      'service': 'Service Provider',
      'ecommerce': 'E-commerce',
      'restaurant': 'Restaurant'
    };
    return types[businessType] || businessType;
  }

  getBusinessTypeIcon(businessType: string): string {
    if (!businessType) return '🏢';
    const icons: { [key: string]: string } = {
      'retail': '🛍️',
      'wholesale': '📦',
      'manufacturer': '🏭',
      'distributor': '🚚',
      'service': '💼',
      'ecommerce': '🛒',
      'restaurant': '🍽️'
    };
    return icons[businessType] || '🏢';
  }

  getVerifiedBadge(verified: boolean): string {
    return verified ? '✅ Verified' : '⏳ Pending';
  }

  getVerifiedClass(verified: boolean): string {
    return verified ? 'verified-true' : 'verified-false';
  }

  applyFilters() {
    let filtered = [...this.merchants];
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(merchant => 
        (merchant.merchant_id && merchant.merchant_id.toLowerCase().includes(term)) ||
        (merchant.owner_name && merchant.owner_name.toLowerCase().includes(term)) ||
        (merchant.business_name && merchant.business_name.toLowerCase().includes(term)) ||
        merchant.phone.includes(term) ||
        this.generateEmail(merchant).toLowerCase().includes(term) ||
        (merchant.city && merchant.city.toLowerCase().includes(term))
      );
    }
    
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(merchant => 
        merchant.status.toLowerCase() === this.selectedStatus.toLowerCase()
      );
    }
    
    if (this.selectedBusinessType !== 'all') {
      filtered = filtered.filter(merchant => 
        merchant.business_type === this.selectedBusinessType
      );
    }
    
    if (this.sortColumn) {
      filtered.sort((a, b) => {
        let aVal: any;
        let bVal: any;
        
        switch(this.sortColumn) {
          case 'merchant_id':
            aVal = a.merchant_id;
            bVal = b.merchant_id;
            break;
          case 'business_name':
            aVal = a.business_name;
            bVal = b.business_name;
            break;
          case 'owner_name':
            aVal = a.owner_name;
            bVal = b.owner_name;
            break;
          case 'phone':
            aVal = a.phone;
            bVal = b.phone;
            break;
          case 'business_type':
            aVal = a.business_type;
            bVal = b.business_type;
            break;
          case 'city':
            aVal = a.city;
            bVal = b.city;
            break;
          case 'status':
            aVal = a.status;
            bVal = b.status;
            break;
          case 'verified':
            aVal = a.verified ? 1 : 0;
            bVal = b.verified ? 1 : 0;
            break;
          case 'payment_plan':
            aVal = a.payment_plan;
            bVal = b.payment_plan;
            break;
          case 'created_at':
            aVal = a.created_at;
            bVal = b.created_at;
            break;
          default:
            aVal = a[this.sortColumn as keyof Merchant];
            bVal = b[this.sortColumn as keyof Merchant];
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
    
    this.filteredMerchants = filtered;
    this.currentPage = 1;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onStatusChange(status: string) {
    this.selectedStatus = status;
    this.applyFilters();
  }

  onBusinessTypeChange(businessType: string) {
    this.selectedBusinessType = businessType;
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

  get paginatedMerchants(): Merchant[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredMerchants.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredMerchants.length / this.itemsPerPage);
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

  onTouchEnd(event: TouchEvent, merchant: Merchant): void {
    this.touchEndX = event.changedTouches[0].clientX;
    const swipeDistance = this.touchEndX - this.touchStartX;
    
    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance > 0) {
        this.onSwipeRight(merchant);
      } else {
        this.onSwipeLeft(merchant);
      }
    }
  }

  onSwipeLeft(merchant: Merchant): void {
    this.selectedMerchant = merchant;
    this.showActionSheet = true;
  }

  onSwipeRight(merchant: Merchant): void {
    this.viewMerchantDetails(merchant);
  }

  viewMerchantDetails(merchant: Merchant): void {
    this.selectedMerchant = merchant;
    this.showDetailModal = true;
    this.showActionSheet = false;
  }

  openEditModal(merchant: Merchant): void {
    this.selectedMerchant = merchant;
    this.editForm.patchValue({
      owner_name: merchant.owner_name,
      business_name: merchant.business_name,
      phone: merchant.phone,
      city: merchant.city,
      address: merchant.address,
      status: merchant.status,
      payment_plan: merchant.payment_plan,
      income_range: merchant.income_range,
      business_type: merchant.business_type,
      registration_number: merchant.registration_number,
      tax_id: merchant.tax_id,
      business_address: merchant.business_address,
      business_phone: merchant.business_phone,
      business_email: merchant.business_email,
      website: merchant.website,
      description: merchant.description,
      verified: merchant.verified,
      product_type: merchant.product_type,
      has_shop: merchant.has_shop,
      shop_url: merchant.shop_url,
      years_in_business: merchant.years_in_business,
      offers_credit: merchant.offers_credit,
      price_range: merchant.price_range,
      payment_method: merchant.payment_method,
      momo_name: merchant.momo_name,
      momo_number: merchant.momo_number,
      bank_name: merchant.bank_name,
      account_name: merchant.account_name,
      account_number: merchant.account_number
    });
    this.showEditModal = true;
    this.showDetailModal = false;
    this.showActionSheet = false;
  }

  updateMerchant(): void {
    if (this.editForm.valid && this.selectedMerchant) {
      this.loading = true;
      const updatedData = { ...this.selectedMerchant, ...this.editForm.value };
      
      this.adminService.updateMerchant(this.selectedMerchant.id, updatedData).subscribe({
        next: (response) => {
          const index = this.merchants.findIndex(m => m.id === this.selectedMerchant!.id);
          if (index !== -1) {
            this.merchants[index] = { ...this.merchants[index], ...this.editForm.value };
            this.applyFilters();
          }
          this.closeModals();
          this.showSuccessMessage('Merchant updated successfully');
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating merchant:', error);
          this.loading = false;
          this.handleError(error);
        }
      });
    }
  }

  verifyMerchant(): void {
    if (this.selectedMerchant && !this.selectedMerchant.verified) {
      this.loading = true;
      this.adminService.verifyMerchant(this.selectedMerchant.id).subscribe({
        next: () => {
          if (this.selectedMerchant) {
            this.selectedMerchant.verified = true;
            const index = this.merchants.findIndex(m => m.id === this.selectedMerchant!.id);
            if (index !== -1) {
              this.merchants[index].verified = true;
              this.applyFilters();
            }
          }
          this.showSuccessMessage('Merchant verified successfully');
          this.loading = false;
          this.closeModals();
        },
        error: (error) => {
          console.error('Error verifying merchant:', error);
          this.loading = false;
          this.handleError(error);
        }
      });
    }
  }

  openDeleteModal(merchant: Merchant): void {
    this.selectedMerchant = merchant;
    this.showDeleteModal = true;
    this.showActionSheet = false;
  }

  deleteMerchant(): void {
    if (this.selectedMerchant) {
      this.loading = true;
      this.adminService.deleteMerchant(this.selectedMerchant.id).subscribe({
        next: () => {
          this.merchants = this.merchants.filter(m => m.id !== this.selectedMerchant!.id);
          this.applyFilters();
          this.closeModals();
          this.showSuccessMessage('Merchant deleted successfully');
          this.loading = false;
        },
        error: (error) => {
          console.error('Error deleting merchant:', error);
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
    this.selectedMerchant = null;
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

  getInitials(name: string): string {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  getDisplayName(merchant: Merchant): string {
    return merchant.business_name || merchant.owner_name || merchant.phone;
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
    this.selectedBusinessType = 'all';
    this.sortColumn = '';
    this.sortDirection = 'asc';
    this.applyFilters();
  }

  exportToCSV(): void {
    const headers = ['ID', 'Merchant ID', 'Business Name', 'Owner Name', 'Phone', 'Email', 'Business Type', 'City', 'Status', 'Verified', 'Join Date'];
    const csvData = this.filteredMerchants.map(m => [
      m.id,
      m.merchant_id || '',
      m.business_name || '',
      m.owner_name || '',
      m.phone,
      this.generateEmail(m),
      this.formatBusinessType(m.business_type),
      m.city || '',
      m.status,
      m.verified ? 'Verified' : 'Pending',
      this.formatDate(m.created_at)
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merchants_${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  showMomoFields(): boolean {
    const paymentMethod = this.editForm.get('payment_method')?.value;
    return paymentMethod === 'Mobile Money' || paymentMethod === 'Both';
  }

  showBankFields(): boolean {
    const paymentMethod = this.editForm.get('payment_method')?.value;
    return paymentMethod === 'Bank Transfer' || paymentMethod === 'Both';
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

  viewMerchantDetail(merchant: Merchant): void {
  // Navigate to the detailed merchant view page
  this.router.navigate(['/admin/merchants-details', merchant.id]);
}
}