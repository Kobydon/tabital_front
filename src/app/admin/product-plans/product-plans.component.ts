import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Product {
  id: number;
  product_id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  stock_quantity: number;
  status: string;
  is_featured: boolean;
  is_new: boolean;
  main_image: string;
  gallery_images: string[];
  merchant_id: number;
  merchant_name: string;
  created_at: string;
}

@Component({
  selector: 'app-product-plans',
  templateUrl: './product-plans.component.html',
  styleUrls: ['./product-plans.component.scss']
})
export class ProductPlansComponent implements OnInit {
  // Data
  products: Product[] = [];
  selectedProduct: any = null;
  productStats: any = {};
  
  // UI State
  isLoading = true;
  showProductModal = false;
  showUpdateStatusModal = false;
  showUpdateStockModal = false;
  isSubmitting = false;
  
  // Filters
  searchTerm = '';
  selectedCategory = '';
  selectedStatus = '';
  selectedMerchantId = '';
  sortBy = 'created_at';
  sortOrder = 'desc';
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 1;
  
  // Forms
  updateStatusForm: FormGroup;
  updateStockForm: FormGroup;
  
  // Math for template
  Math = Math;
  
  // Category Options
  categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Phones', label: 'Phones' },
    { value: 'Laptops', label: 'Laptops' },
    { value: 'Tablets', label: 'Tablets' },
    { value: 'Accessories', label: 'Accessories' },
    { value: 'Appliances', label: 'Appliances' },
    { value: 'Furniture', label: 'Furniture' },
    { value: 'Fashion', label: 'Fashion' },
    { value: 'Sports', label: 'Sports' },
    { value: 'Books', label: 'Books' },
    { value: 'Other', label: 'Other' }
  ];

  // Status Options
  statusOptions = [
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'out_of_stock', label: 'Out of Stock' }
  ];

  // Stats Cards
  statsCards = [
    { label: 'Total Products', value: 0, icon: '📦', color: 'blue', isCurrency: false },
    { label: 'Active Products', value: 0, icon: '✅', color: 'green', isCurrency: false },
    { label: 'Out of Stock', value: 0, icon: '⚠️', color: 'red', isCurrency: false },
    { label: 'Low Stock', value: 0, icon: '📉', color: 'orange', isCurrency: false },
    { label: 'Featured', value: 0, icon: '⭐', color: 'yellow', isCurrency: false },
    { label: 'New (30 Days)', value: 0, icon: '🆕', color: 'purple', isCurrency: false },
    { label: 'Total Value', value: 0, icon: '💰', color: 'teal', isCurrency: true }
  ];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.updateStatusForm = this.fb.group({
      status: ['', Validators.required],
      reason: ['']
    });
    
    this.updateStockForm = this.fb.group({
      stock_quantity: ['', [Validators.required, Validators.min(0)]],
      reason: ['']
    });
  }

  ngOnInit(): void {
    this.loadProductStats();
    this.loadProducts();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadProductStats(): void {
    this.adminService.getProductStats().subscribe({
      next: (response: any) => {
        console.log('Product stats:', response);
        this.productStats = response;
        this.updateStatsCards();
      },
      error: (error) => {
        console.error('Error loading product stats:', error);
      }
    });
  }

  updateStatsCards(): void {
    this.statsCards[0].value = this.productStats.total_products || 0;
    this.statsCards[1].value = this.productStats.active_products || 0;
    this.statsCards[2].value = this.productStats.out_of_stock || 0;
    this.statsCards[3].value = this.productStats.low_stock || 0;
    this.statsCards[4].value = this.productStats.featured_products || 0;
    this.statsCards[5].value = this.productStats.new_products || 0;
    this.statsCards[6].value = this.productStats.total_value || 0;
  }

  loadProducts(): void {
    this.isLoading = true;
    
    const filters: any = {
      page: this.currentPage,
      per_page: this.pageSize,
      search: this.searchTerm,
      category: this.selectedCategory,
      status: this.selectedStatus,
      merchant_id: this.selectedMerchantId,
      sort_by: this.sortBy,
      sort_order: this.sortOrder
    };
    
    this.adminService.getAllProducts(filters).subscribe({
      next: (response: any) => {
        console.log('Products response:', response);
        if (Array.isArray(response)) {
          this.products = response;
          this.totalItems = response.length;
          this.totalPages = 1;
        } else {
          this.products = response.products || [];
          this.totalItems = response.total || 0;
          this.totalPages = response.total_pages || 1;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
      }
    });
  }

  // ============================================
  // PRODUCT DETAILS
  // ============================================

  viewProductDetails(product: Product): void {
    this.adminService.getProductDetail(product.id).subscribe({
      next: (response: any) => {
        this.selectedProduct = response;
        this.showProductModal = true;
      },
      error: (error) => {
        console.error('Error loading product details:', error);
        alert('Failed to load product details');
      }
    });
  }

  // ============================================
  // PRODUCT ACTIONS
  // ============================================

  openUpdateStatusModal(product: Product): void {
    this.selectedProduct = { product };
    this.updateStatusForm.patchValue({ status: product.status, reason: '' });
    this.showUpdateStatusModal = true;
  }

  updateProductStatus(): void {
    if (this.updateStatusForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.updateStatusForm.value;
    
    this.adminService.updateProductStatus(this.selectedProduct.product.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Product status updated successfully');
        this.showUpdateStatusModal = false;
        this.loadProducts();
        this.loadProductStats();
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.isSubmitting = false;
        alert('Failed to update product status');
      }
    });
  }

  openUpdateStockModal(product: Product): void {
    this.selectedProduct = { product };
    this.updateStockForm.patchValue({ stock_quantity: product.stock_quantity, reason: '' });
    this.showUpdateStockModal = true;
  }

  updateProductStock(): void {
    if (this.updateStockForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.updateStockForm.value;
    
    this.adminService.updateProductStock(this.selectedProduct.product.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Stock updated successfully');
        this.showUpdateStockModal = false;
        this.loadProducts();
        this.loadProductStats();
      },
      error: (error) => {
        console.error('Error updating stock:', error);
        this.isSubmitting = false;
        alert('Failed to update stock');
      }
    });
  }

  toggleFeatured(product: Product): void {
    const newFeatured = !product.is_featured;
    
    this.adminService.updateProductFeatured(product.id, { is_featured: newFeatured }).subscribe({
      next: (response) => {
        alert(`Product ${newFeatured ? 'featured' : 'unfeatured'} successfully`);
        this.loadProducts();
      },
      error: (error) => {
        console.error('Error toggling featured:', error);
        alert('Failed to update featured status');
      }
    });
  }

  exportProducts(): void {
    const filters: any = {
      category: this.selectedCategory,
      status: this.selectedStatus
    };
    
    this.adminService.exportProducts(filters).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        alert('Products exported successfully!');
      },
      error: (error) => {
        console.error('Error exporting products:', error);
        alert('Failed to export products');
      }
    });
  }

  // ============================================
  // FILTERS & SORTING
  // ============================================

  applyFilters(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.selectedMerchantId = '';
    this.sortBy = 'created_at';
    this.sortOrder = 'desc';
    this.currentPage = 1;
    this.loadProducts();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'desc';
    }
    this.loadProducts();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadProducts();
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

  getStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'out_of_stock': return 'status-out-of-stock';
      default: return '';
    }
  }

  getStockClass(quantity: number): string {
    if (quantity <= 0) return 'stock-out';
    if (quantity < 10) return 'stock-low';
    return 'stock-in';
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
    return num.toLocaleString();
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

  truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  closeModals(): void {
    this.showProductModal = false;
    this.showUpdateStatusModal = false;
    this.showUpdateStockModal = false;
    this.selectedProduct = null;
    this.isSubmitting = false;
  }
}