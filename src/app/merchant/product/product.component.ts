import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MerchantService } from '../../merchant.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { AdminService } from 'src/app/admin/admin.service';

export interface Product {
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
  sku: string;
  barcode: string;
  main_image: string;
  gallery_images: string[];
  status: string;
  is_featured: boolean;
  is_new: boolean;
  created_at: string;
  updated_at: string;
}

export interface MerchantKYC {
  kyc_status: 'pending' | 'verified' | 'rejected';
  verification_level: string;
  kyc_completed_on: string | null;
}

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnInit {
  // Data
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProduct: Product | null = null;
  
  // KYC/KYB Status
  merchantKYC: MerchantKYC | null = null;
  isKYCPending: boolean = false;
  showKYCBlockModal: boolean = false;
  
  // UI State
  isLoading = true;
  isSaving = false;
  currentPage = 1;
  pageSize = 12;
  totalItems = 0;
  totalPages = 1;
  showProductModal = false;
  showDeleteModal = false;
  isEditMode = false;
  activeTab: 'all' | 'active' | 'inactive' | 'out_of_stock' = 'all';
  
  // Forms
  productForm: FormGroup;
  
  // Search & Filters
  searchTerm = '';
  selectedCategory = '';
  
  // Image Upload (Base64)
  selectedMainImage: string | null = null;
  selectedGalleryImages: string[] = [];
  mainImagePreview: string | null = null;
  galleryPreviews: string[] = [];
  
  // Categories
  categories = [
    'Electronics', 'Phones', 'Laptops', 'Tablets', 'Accessories',
    'Appliances', 'Furniture', 'Fashion', 'Sports', 'Books', 'Other'
  ];

  constructor(
    private merchantService: MerchantService,
    private fb: FormBuilder,
    private router: Router,
    private adminService: AdminService,
    private auth: AuthService
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      category: ['', Validators.required],
      brand: [''],
      model: [''],
      year: [''],
      price: ['', [Validators.required, Validators.min(1)]],
      stock_quantity: [0, [Validators.required, Validators.min(0)]],
      sku: [''],
      barcode: [''],
      status: ['active'],
      is_featured: [false],
      is_new: [false]
    });
  }

  ngOnInit(): void {
    this.checkKYCStatus();
    this.loadProducts();
  }

  // ============================================
  // KYC/KYB VERIFICATION CHECK
  // ============================================

  checkKYCStatus(): void {
    this.adminService.getCurrentUser().subscribe({
      next: (profile: any) => {
        this.merchantKYC = {
          kyc_status: profile.kyc_status || 'pending',
          verification_level: profile.verification_level || 'standard',
          kyc_completed_on: profile.kyc_completed_on || null
        };
        // Only allow if status is 'verified' - NOT 'approved'
        this.isKYCPending = this.merchantKYC.kyc_status !== 'verified';
      },
      error: (error) => {
        console.error('Error fetching merchant profile:', error);
        this.isKYCPending = true;
      }
    });
  }

  canManageProducts(): boolean {
    return this.merchantKYC?.kyc_status === 'verified';
  }

  getKYCBlockTitle(): string {
    return this.merchantKYC?.kyc_status === 'rejected' 
      ? 'KYC Verification Rejected' 
      : 'KYC Verification Required';
  }

  getKYCBlockMessageText(): string {
    return this.merchantKYC?.kyc_status === 'rejected'
      ? 'Your KYC verification has been rejected. Please update your documents and resubmit for approval before you can manage products.'
      : 'Your KYC (Know Your Customer) / KYB (Know Your Business) verification is currently pending. You need to complete your business verification before you can add or edit products.';
  }

  getKYCBlockButtonText(): string {
    return this.merchantKYC?.kyc_status === 'rejected' ? 'Update Documents' : 'Verify Now';
  }

  getKYCBlockIcon(): string {
    return this.merchantKYC?.kyc_status === 'rejected' ? 'fa-times-circle' : 'fa-shield-alt';
  }

  showKYCBlockedModal(): void {
    this.showKYCBlockModal = true;
  }

  navigateToDocuments(): void {
    this.showKYCBlockModal = false;
    this.router.navigate(['/merchant/documents']);
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadProducts(): void {
    this.isLoading = true;
    
    const filters: any = {
      page: this.currentPage,
      limit: this.pageSize,
      status: this.activeTab !== 'all' ? this.activeTab : '',
      search: this.searchTerm,
      category: this.selectedCategory
    };
    
    this.merchantService.getMerchantProducts(filters).subscribe({
      next: (response: any) => {
        this.products = response.products || [];
        this.filteredProducts = this.products;
        this.totalItems = response.total || 0;
        this.totalPages = response.total_pages || 1;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
        this.products = [];
        this.filteredProducts = [];
      }
    });
  }

  // ============================================
  // FILTER METHODS
  // ============================================

  filterByTab(tab: 'all' | 'active' | 'inactive' | 'out_of_stock'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.loadProducts();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.activeTab = 'all';
    this.currentPage = 1;
    this.loadProducts();
  }

  // ============================================
  // IMAGE HANDLING (Base64 Conversion)
  // ============================================

  onMainImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.mainImagePreview = reader.result as string;
        this.selectedMainImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onGalleryImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const reader = new FileReader();
        reader.onload = () => {
          this.galleryPreviews.push(reader.result as string);
          this.selectedGalleryImages.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeMainImage(): void {
    this.selectedMainImage = null;
    this.mainImagePreview = null;
  }

  removeGalleryImage(index: number): void {
    this.selectedGalleryImages.splice(index, 1);
    this.galleryPreviews.splice(index, 1);
  }

  clearImages(): void {
    this.selectedMainImage = null;
    this.selectedGalleryImages = [];
    this.mainImagePreview = null;
    this.galleryPreviews = [];
  }

  // ============================================
  // PRODUCT ACTIONS (With KYC Check)
  // ============================================

  openAddModal(): void {
    if (this.isKYCPending) {
      this.showKYCBlockedModal();
      return;
    }
    
    this.isEditMode = false;
    this.selectedProduct = null;
    this.resetForm();
    this.clearImages();
    this.showProductModal = true;
  }

  openEditModal(product: Product): void {
    if (this.isKYCPending) {
      this.showKYCBlockedModal();
      return;
    }
    
    this.isEditMode = true;
    this.selectedProduct = product;
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      category: product.category,
      brand: product.brand,
      model: product.model,
      year: product.year,
      price: product.price,
      stock_quantity: product.stock_quantity,
      sku: product.sku,
      barcode: product.barcode,
      status: product.status,
      is_featured: product.is_featured,
      is_new: product.is_new
    });
    
    this.mainImagePreview = product.main_image;
    this.selectedMainImage = product.main_image;
    this.galleryPreviews = product.gallery_images || [];
    this.selectedGalleryImages = product.gallery_images || [];
    this.showProductModal = true;
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      Object.keys(this.productForm.controls).forEach(key => {
        this.productForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.isSaving = true;
    
    const productData = {
      ...this.productForm.value,
      main_image: this.selectedMainImage || '',
      gallery_images: this.selectedGalleryImages
    };
    
    if (this.isEditMode && this.selectedProduct) {
      this.merchantService.updateProduct(this.selectedProduct.id, productData).subscribe({
        next: (response) => {
          this.isSaving = false;
          this.showProductModal = false;
          this.loadProducts();
          this.showSuccess('Product updated successfully!');
        },
        error: (error) => {
          console.error('Error updating product:', error);
          this.isSaving = false;
          this.showError('Failed to update product. Please try again.');
        }
      });
    } else {
      this.merchantService.createProduct(productData).subscribe({
        next: (response) => {
          this.isSaving = false;
          this.showProductModal = false;
          this.loadProducts();
          this.showSuccess('Product created successfully!');
        },
        error: (error) => {
          console.error('Error creating product:', error);
          this.isSaving = false;
          this.showError('Failed to create product. Please try again.');
        }
      });
    }
  }

  deleteProduct(): void {
    if (!this.selectedProduct) return;
    
    this.merchantService.deleteProduct(this.selectedProduct.id).subscribe({
      next: (response) => {
        this.showDeleteModal = false;
        this.loadProducts();
        this.showSuccess('Product deleted successfully!');
      },
      error: (error) => {
        console.error('Error deleting product:', error);
        this.showError('Failed to delete product. Please try again.');
      }
    });
  }

  confirmDelete(product: Product): void {
    this.selectedProduct = product;
    this.showDeleteModal = true;
  }

  toggleStatus(product: Product): void {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    this.merchantService.updateProduct(product.id, { status: newStatus }).subscribe({
      next: (response) => {
        this.loadProducts();
        this.showSuccess(`Product ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);
      },
      error: (error) => {
        console.error('Error toggling status:', error);
        this.showError('Failed to update product status.');
      }
    });
  }

  // ============================================
  // UI HELPERS
  // ============================================

  resetForm(): void {
    this.productForm.reset({
      stock_quantity: 0,
      status: 'active',
      is_featured: false,
      is_new: false
    });
  }

  showSuccess(message: string): void {
    alert(message);
  }

  showError(message: string): void {
    alert(message);
  }

  closeModals(): void {
    this.showProductModal = false;
    this.showDeleteModal = false;
    this.showKYCBlockModal = false;
    this.selectedProduct = null;
    this.resetForm();
    this.clearImages();
  }

  formatCurrency(amount: number): string {
    if (!amount) return 'GHS 0.00';
    return new Intl.NumberFormat('en-GH', { 
      style: 'currency', 
      currency: 'GHS',
      minimumFractionDigits: 2
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'out_of_stock': return 'status-out';
      default: return '';
    }
  }

  getStockStatus(stock: number): string {
    if (stock <= 0) return 'Out of Stock';
    if (stock < 10) return 'Low Stock';
    return 'In Stock';
  }

  getStockClass(stock: number): string {
    if (stock <= 0) return 'stock-out';
    if (stock < 10) return 'stock-low';
    return 'stock-in';
  }

  // ============================================
  // PAGINATION
  // ============================================

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
}