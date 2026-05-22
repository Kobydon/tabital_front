// src/app/customer/components/plans/plans.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerService } from 'src/app/customers.service';

export interface Product {
  id: number;
  product_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  merchant_id: number;
  merchant_name: string;
  merchant_rating: number;
  image_url?: string;
  instalment_options: InstalmentOption[];
  is_popular: boolean;
  is_new: boolean;
  stock: number;
}

export interface InstalmentOption {
  term: number; // months
  down_payment_percentage: number;
  monthly_payment: number;
  total_interest: number;
  total_amount: number;
  frequency: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface ApplicationForm {
  product_id: number;
  term: number;
  down_payment: number;
  monthly_income?: number;
  employment_status?: string;
  id_type?: string;
  id_number?: string;
}

@Component({
  selector: 'app-customer-plans',
  templateUrl: './customer-plans.component.html',
  styleUrls: ['./customer-plans.component.scss']
})
export class CustomerPlansComponent implements OnInit {
  // Data
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  selectedProduct: Product | null = null;
  featuredProducts: Product[] = [];
  
  // UI State
  isLoading = true;
  isApplying = false;
  currentPage = 1;
  pageSize = 12;
  totalItems = 0;
  totalPages = 1;
  selectedCategory = 'all';
  sortBy: 'popular' | 'price_low' | 'price_high' | 'newest' = 'popular';
  
  // Filters
  searchTerm = '';
  priceRange: { min: number; max: number } = { min: 0, max: 10000 };
  selectedTerm: number = 3;
  
  // Modal States
  showProductModal = false;
  showApplyModal = false;
  showSuccessModal = false;
  
  // Forms
  applicationForm: FormGroup;
  
  // Term Options
  termOptions = [
    { value: 3, label: '3 Months', icon: '📅', interest: '5%' },
    { value: 6, label: '6 Months', icon: '📅', interest: '8%' },
    { value: 9, label: '9 Months', icon: '📅', interest: '11%' },
    { value: 12, label: '12 Months', icon: '📅', interest: '15%' }
  ];
  
  // Categories
  categoryList = [
    { id: 'electronics', name: 'Electronics', icon: '📱', count: 0 },
    { id: 'phones', name: 'Phones', icon: '📱', count: 0 },
    { id: 'laptops', name: 'Laptops', icon: '💻', count: 0 },
    { id: 'appliances', name: 'Appliances', icon: '🔌', count: 0 },
    { id: 'furniture', name: 'Furniture', icon: '🛋️', count: 0 },
    { id: 'fashion', name: 'Fashion', icon: '👕', count: 0 }
  ];

  constructor(
    private customerService: CustomerService,
    private fb: FormBuilder,  public router:Router
  ) {
    this.applicationForm = this.fb.group({
      term: [3, Validators.required],
      down_payment: [0, [Validators.required, Validators.min(0)]],
      monthly_income: ['', [Validators.required, Validators.min(500)]],
      employment_status: ['', Validators.required],
      id_type: ['', Validators.required],
      id_number: ['', Validators.required],
      agree_terms: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadProducts(): void {
    this.isLoading = true;
    
    const filters: any = {
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchTerm,
      category: this.selectedCategory !== 'all' ? this.selectedCategory : '',
      sort: this.sortBy,
      min_price: this.priceRange.min,
      max_price: this.priceRange.max
    };
    
    this.customerService.getAvailableProducts(filters).subscribe({
      next: (response: any) => {
        this.products = (response.products || []).map((p: any) => this.mapProduct(p));
        this.filteredProducts = [...this.products];
        this.totalItems = response.total || this.products.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        
        // Set featured products (first 3)
        this.featuredProducts = this.products.slice(0, 3);
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

  loadCategories(): void {
    // In production, get from API
    this.categories = this.categoryList;
  }

  private mapProduct(product: any): Product {
    // Calculate instalment options
    const instalment_options: InstalmentOption[] = this.termOptions.map(term => {
      const price = product.price || 0;
      const interestRate = this.getInterestRate(term.value);
      const totalInterest = price * (interestRate / 100);
      const totalAmount = price + totalInterest;
      const downPayment = price * 0.1; // 10% down payment
      const remainingAmount = totalAmount - downPayment;
      const monthlyPayment = remainingAmount / term.value;
      
      return {
        term: term.value,
        down_payment_percentage: 10,
        monthly_payment: Math.round(monthlyPayment * 100) / 100,
        total_interest: Math.round(totalInterest * 100) / 100,
        total_amount: Math.round(totalAmount * 100) / 100,
        frequency: 'monthly'
      };
    });
    
    return {
      id: product.id,
      product_id: product.product_id || `P${product.id}`,
      name: product.name || product.product_name,
      description: product.description || product.product_description,
      price: product.price || product.amount || 0,
      category: product.category || 'electronics',
      merchant_id: product.merchant_id,
      merchant_name: product.merchant_name || 'Merchant',
      merchant_rating: product.merchant_rating || 4.5,
      image_url: product.image_url,
      instalment_options: instalment_options,
      is_popular: product.is_popular || false,
      is_new: product.is_new || false,
      stock: product.stock || 10
    };
  }

  private getInterestRate(term: number): number {
    switch(term) {
      case 3: return 5;
      case 6: return 8;
      case 9: return 11;
      case 12: return 15;
      default: return 10;
    }
  }

  // ============================================
  // FILTER METHODS
  // ============================================

  applyFilters(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'all';
    this.sortBy = 'popular';
    this.priceRange = { min: 0, max: 10000 };
    this.selectedTerm = 3;
    this.currentPage = 1;
    this.loadProducts();
  }

  filterByCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.applyFilters();
  }

  changeSort(sort: 'popular' | 'price_low' | 'price_high' | 'newest'): void {
    this.sortBy = sort;
    this.applyFilters();
  }

  // ============================================
  // PRODUCT ACTIONS
  // ============================================

  viewProductDetails(product: Product): void {
    this.selectedProduct = product;
    this.showProductModal = true;
  }

  openApplyModal(product: Product, term?: number): void {
    this.selectedProduct = product;
    this.applicationForm.reset({
      term: term || 3,
      down_payment: product.price * 0.1,
      monthly_income: '',
      employment_status: '',
      id_type: '',
      id_number: '',
      agree_terms: false
    });
    
    // Update down payment when term changes
    this.applicationForm.get('term')?.valueChanges.subscribe((termValue) => {
      const downPayment = product.price * 0.1;
      this.applicationForm.patchValue({ down_payment: downPayment });
      this.updateMonthlyPayment(product, termValue);
    });
    
    this.updateMonthlyPayment(product, term || 3);
    this.showApplyModal = true;
    this.showProductModal = false;
  }

  updateMonthlyPayment(product: Product, term: number): void {
    const instalmentOption = product.instalment_options.find(opt => opt.term === term);
    if (instalmentOption) {
      const monthlyPaymentElement = document.getElementById('monthlyPayment');
      if (monthlyPaymentElement) {
        monthlyPaymentElement.textContent = this.formatCurrency(instalmentOption.monthly_payment);
      }
    }
  }

  submitApplication(): void {
    if (this.applicationForm.invalid || !this.selectedProduct) return;
    
    this.isApplying = true;
    
    const formData = this.applicationForm.value;
    const applicationData = {
      product_id: this.selectedProduct.id,
      term: formData.term,
      down_payment: formData.down_payment,
      monthly_income: formData.monthly_income,
      employment_status: formData.employment_status,
      id_type: formData.id_type,
      id_number: formData.id_number
    };
    
    this.customerService.applyForInstalment(applicationData).subscribe({
      next: (response) => {
        this.isApplying = false;
        this.showApplyModal = false;
        this.showSuccessModal = true;
      },
      error: (error) => {
        console.error('Error applying for instalment:', error);
        this.isApplying = false;
        alert('Application failed. Please try again.');
      }
    });
  }

  // ============================================
  // CALCULATION METHODS
  // ============================================

  calculateMonthlyPayment(price: number, term: number): number {
    const interestRate = this.getInterestRate(term);
    const totalInterest = price * (interestRate / 100);
    const totalAmount = price + totalInterest;
    const downPayment = price * 0.1;
    const remainingAmount = totalAmount - downPayment;
    return Math.round((remainingAmount / term) * 100) / 100;
  }

  calculateTotalAmount(price: number, term: number): number {
    const interestRate = this.getInterestRate(term);
    const totalInterest = price * (interestRate / 100);
    return price + totalInterest;
  }

  // ============================================
  // MODAL CONTROLS
  // ============================================

  closeModals(): void {
    this.showProductModal = false;
    this.showApplyModal = false;
    this.showSuccessModal = false;
    this.selectedProduct = null;
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

  formatNumber(num: number): string {
    return num.toLocaleString('en-GH');
  }

  getCategoryIcon(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.icon || '📦';
  }

  getStars(rating: number): string[] {
    const stars: string[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) stars.push('⭐');
    if (hasHalfStar) stars.push('½');
    while (stars.length < 5) stars.push('☆');
    
    return stars;
  }
}