import { environment } from 'src/environments/environment';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../../customers.service';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/admin/admin.service';

import { notify } from 'src/app/shared/notify';
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
  main_image: string;
  gallery_images: string[];
  merchant_id: number;
  merchant_name: string;
  status: string;
}

export interface InstallmentOption {
  months: number;
  label: string;
  interest_rate: number;
  is_active: boolean;
  coming_soon?: boolean;
}

export interface InstallmentCalculation {
  product_price: number;
  down_payment: {
    percentage: number;
    amount: number;
  };
  due_now: number;
  remaining_balance: number;
  installment_details: {
    total_installments: number;
    remaining_installments: number;
    installment_amount: number;
  };
  // Customer's underwriting result for this quote (Phase 3)
  credit?: {
    eligible: boolean;
    tier: string | null;
    credit_limit: number;
    available_limit: number;
    reasons: string[];
  } | null;
  fees: {
    service_fee: number;
    delivery_fee: number;
    merchant_fee_percentage: number;
    merchant_fee_amount: number;
    late_fee_percentage: number;
  };
  totals: {
    total_payable: number;
    merchant_payout: number;
  };
  payment_schedule: PaymentSchedule[];
  // Disclosures shown before the customer commits (§10); values come from the server's settings
  key_facts?: {
    late_fee_percentage: number;
    second_late_fee_percentage: number;
    second_late_fee_after_days: number;
    late_fee_cap_percentage: number;
    deferment_enabled: boolean;
    deferment_fee_percentage: number;
    deferment_max_per_plan: number;
    deferment_months: number;
    dispute_resolution_days: number;
    terms_url: string;
    terms_version: string;
    privacy_url: string;
  };
}

export interface PaymentSchedule {
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  description: string;
}

export interface CustomerKYC {
  kyc_status: 'pending' | 'verified' | 'rejected';
  verification_level: string;
  kyc_completed_on: string | null;
}

@Component({
  selector: 'app-customer-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss']
})
export class CustomerShopComponent implements OnInit {
  /** Terms, privacy and agreement links (environment.legal, §10). */
  readonly legal = environment.legal;

  // Data
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProduct: Product | null = null;
  installmentOptions: InstallmentOption[] = [];
  calculation: InstallmentCalculation | null = null;
  
  // KYC/KYB Status
  customerKYC: CustomerKYC | null = null;
  isKYCPending: boolean = false;
  showKYCBlockModal: boolean = false;
  
  // UI State
  isLoading = true;
  isCalculating = false;
  isPurchasing = false;
  // When on, Payment 1 (down payment + delivery) is paid on Paystack at checkout
  paystackEnabled = false;
  currentPage = 1;
  pageSize = 12;
  totalItems = 0;
  totalPages = 1;
  showProductModal = false;
  showCheckoutModal = false;
  selectedCategory = '';
  searchTerm = '';
  
  // Forms
  purchaseForm: FormGroup;

  // Categories
  categories = [
    'Electronics', 'Phones', 'Laptops', 'Tablets', 'Accessories',
    'Appliances', 'Furniture', 'Fashion', 'Sports', 'Books', 'Other'
  ];

  constructor(
    private customerService: CustomerService,
    private fb: FormBuilder,
    private adminService: AdminService,
    private router: Router
  ) {
    this.purchaseForm = this.fb.group({
      selected_installments: [1, Validators.required],
      delivery_address: ['', [Validators.required, Validators.minLength(10)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      agree_terms: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    this.customerService.getPaymentConfig().subscribe({
      next: (cfg) => this.paystackEnabled = !!cfg?.paystack_enabled,
      error: () => this.paystackEnabled = false
    });
    this.checkKYCStatus();
    this.loadProducts();
    this.loadInstallmentOptions();
  }

  // ============================================
  // KYC/KYB VERIFICATION CHECK
  // ============================================

  checkKYCStatus(): void {
    this.adminService.getCurrentUser().subscribe({
      next: (profile: any) => {
        this.customerKYC = {
          kyc_status: profile.kyc_status || 'pending',
          verification_level: profile.verification_level || 'standard',
          kyc_completed_on: profile.kyc_completed_on || null
        };
        this.isKYCPending = this.customerKYC.kyc_status !== 'verified';
      },
      error: (error) => {
        console.error('Error fetching customer profile:', error);
        this.isKYCPending = true;
      }
    });
  }

  canPurchase(): boolean {
    return this.customerKYC?.kyc_status === 'verified';
  }

  getKYCBlockTitle(): string {
    return this.customerKYC?.kyc_status === 'rejected' 
      ? 'KYC Verification Rejected' 
      : 'KYC Verification Required';
  }

  getKYCBlockMessageText(): string {
    return this.customerKYC?.kyc_status === 'rejected'
      ? 'Your KYC verification has been rejected. Please update your documents and resubmit for approval before you can make purchases.'
      : 'Your KYC (Know Your Customer) verification is currently pending. You need to complete your identity verification before you can make purchases on our platform.';
  }

  getKYCBlockButtonText(): string {
    return this.customerKYC?.kyc_status === 'rejected' ? 'Update Documents' : 'Verify Now';
  }

  getKYCBlockIcon(): string {
    return this.customerKYC?.kyc_status === 'rejected' ? 'fa-times-circle' : 'fa-shield-alt';
  }

  showKYCBlockedModal(): void {
    this.showKYCBlockModal = true;
  }

  navigateToKYC(): void {
    this.showKYCBlockModal = false;
    this.router.navigate(['/customer/verify-identity']);     // Phase 6: selfie + Ghana Card check
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
      category: this.selectedCategory,
      status: 'active'
    };
    
    this.customerService.getAvailableProducts(filters).subscribe({
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

  loadInstallmentOptions(): void {
    this.installmentOptions = [
      { months: 1, label: 'Full Payment', interest_rate: 0, is_active: true },
      { months: 2, label: 'Pay in 2', interest_rate: 0, is_active: true },
      { months: 3, label: 'Pay in 3', interest_rate: 0, is_active: true },
      { months: 4, label: 'Pay in 4', interest_rate: 0, is_active: true },
      { months: 6, label: '6 Months', interest_rate: 0, is_active: false, coming_soon: true }
    ];
  }

  calculateInstallment(product: Product, months: number): void {
    this.isCalculating = true;
    this.calculation = null;
    
    // The server is the only source of plan amounts. If it can't quote, we don't show one.
    this.customerService.calculateInstallmentPlan({
      product_price: product.price,
      number_of_installments: months,
      quantity: this.purchaseForm.value.quantity
    }).subscribe({
      next: (response: InstallmentCalculation) => {
        this.calculation = response;
        this.isCalculating = false;
      },
      error: () => {
        this.isCalculating = false;
        notify('We could not calculate this payment plan right now. Please try again.', 'error');
      }
    });
  }

  // ============================================
  // PRODUCT ACTIONS (With KYC Check)
  // ============================================

  viewProduct(product: Product): void {
    this.selectedProduct = product;
    this.purchaseForm.patchValue({ quantity: 1, selected_installments: 1 });
    this.showProductModal = true;
    this.calculateInstallment(product, 1);
  }

  selectInstallment(months: number): void {
    const option = this.installmentOptions.find(opt => opt.months === months);
    if (option && !option.is_active) {
      notify(`${option.label} is coming soon! Please select another payment plan.`);
      return;
    }
    
    if (this.selectedProduct) {
      this.purchaseForm.patchValue({ selected_installments: months });
      this.calculateInstallment(this.selectedProduct, months);
    }
  }

  updateQuantity(action?: 'increase' | 'decrease'): void {
    if (!this.selectedProduct) return;
    
    let currentQuantity = this.purchaseForm.value.quantity;
    
    if (action === 'increase') {
      currentQuantity++;
    } else if (action === 'decrease') {
      currentQuantity--;
    }
    
    if (currentQuantity < 1) currentQuantity = 1;
    if (currentQuantity > this.selectedProduct.stock_quantity) {
      currentQuantity = this.selectedProduct.stock_quantity;
    }
    
    this.purchaseForm.patchValue({ quantity: currentQuantity });
    
    const months = this.purchaseForm.value.selected_installments || 1;
    this.calculateInstallment(this.selectedProduct, months);
  }

  // Why this plan can't be bought right now, or null if it can (the server checks again at checkout)
  creditBlockReason(): string | null {
    const credit = this.calculation?.credit;
    const months = this.purchaseForm.value.selected_installments;
    if (!credit || months === 1) return null;         // full payment uses no credit
    if (!credit.eligible) return credit.reasons?.[0] || 'You are not eligible for a payment plan yet';
    if ((this.calculation?.product_price || 0) > credit.available_limit) {
      return `This is above your available limit of ${this.formatCurrency(credit.available_limit)}`;
    }
    return null;
  }

  openCheckout(): void {
    if (this.isKYCPending) {
      this.showKYCBlockedModal();
      return;
    }
    const blocked = this.creditBlockReason();
    if (blocked) {
      notify(blocked);
      return;
    }
    
    if (!this.selectedProduct || !this.calculation) return;
    this.showCheckoutModal = true;
  }

  placeOrder(): void {
    if (this.purchaseForm.invalid || this.isPurchasing) return;     // no double orders from a double tap

    this.isPurchasing = true;
    
    // Only the choice is sent. The server prices the order from the stored product.
    const orderData = {
      product_id: this.selectedProduct?.id,
      quantity: this.purchaseForm.value.quantity,
      number_of_installments: this.purchaseForm.value.selected_installments,
      delivery_address: this.purchaseForm.value.delivery_address,
      accept_terms: this.purchaseForm.value.agree_terms === true      // recorded with the order (§10)
    };
    
    this.customerService.createPurchaseOrder(orderData).subscribe({
      next: (response: any) => {
        // Down payment is collected now: go to Paystack's secure checkout
        if (response?.authorization_url) {
          window.location.href = response.authorization_url;
          return;
        }
        this.isPurchasing = false;
        this.showCheckoutModal = false;
        this.showProductModal = false;
        notify(response?.message || 'Order placed successfully! Waiting for admin approval.');
        this.router.navigate(['/customer/orders']);
      },
      error: (error) => {
        this.isPurchasing = false;
        const reasons: string[] = error?.error?.reasons || [];
        notify([error?.error?.error || 'Failed to place order. Please try again.', ...reasons].join('\n• '), 'error');
      }
    });
  }

  // ============================================
  // FILTER METHODS
  // ============================================

  applyFilters(): void {
    clearTimeout(this.searchTimer);
    this.currentPage = 1;
    this.loadProducts();
  }

  // Wait until the customer stops typing, instead of calling the API on every key
  private searchTimer: any = null;
  onSearchChange(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.applyFilters(), 300);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.currentPage = 1;
    this.loadProducts();
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Electronics': '📱',
      'Phones': '📱',
      'Laptops': '💻',
      'Tablets': '📟',
      'Accessories': '🎧',
      'Appliances': '🔌',
      'Furniture': '🛋️',
      'Fashion': '👕',
      'Sports': '⚽',
      'Books': '📚',
      'Other': '📦'
    };
    return icons[category] || '📦';
  }

  // ============================================
  // MODAL CONTROLS
  // ============================================

  closeModals(): void {
    this.showProductModal = false;
    this.showCheckoutModal = false;
    this.showKYCBlockModal = false;
    this.selectedProduct = null;
    this.calculation = null;
    this.purchaseForm.patchValue({
      selected_installments: 1,
      quantity: 1,
      agree_terms: false
    });
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
      currency: 'GHS', currencyDisplay: 'code',
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

  getStockStatus(stock: number): string {
    if (stock <= 0) return 'Out of Stock';
    if (stock < 10) return 'Low Stock';
    return 'In Stock';
  }

  getStockClass(stock: number): string {
    if (stock <= 0) return 'out';
    if (stock < 10) return 'low';
    return 'in';
  }
}
