// customer/components/shop/shop.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../../customers.service';
import { Router } from '@angular/router';

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
}

export interface InstallmentCalculation {
  product_price: number;
  down_payment: {
    percentage: number;
    amount: number;
  };
  remaining_balance: number;
  installment_details: {
    total_installments: number;
    remaining_installments: number;
    installment_amount: number;
  };
  fees: {
    service_fee: number;
    merchant_fee_percentage: number;
    merchant_fee_amount: number;
    late_fee_percentage: number;
  };
  totals: {
    total_payable: number;
    merchant_payout: number;
  };
  payment_schedule: PaymentSchedule[];
}

export interface PaymentSchedule {
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  description: string;
}

@Component({
  selector: 'app-customer-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss']
})
export class CustomerShopComponent implements OnInit {
  // Data
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProduct: Product | null = null;
  installmentOptions: InstallmentOption[] = [];
  calculation: InstallmentCalculation | null = null;
  
  // UI State
  isLoading = true;
  isCalculating = false;
  isPurchasing = false;
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
    private router: Router
  ) {
    this.purchaseForm = this.fb.group({
      selected_installments: [4, Validators.required],
      delivery_address: ['', [Validators.required, Validators.minLength(10)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      agree_terms: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadInstallmentOptions();
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
    this.customerService.getInstallmentOptions().subscribe({
      next: (response: any) => {
        this.installmentOptions = response.installment_options || [];
      },
      error: (error) => {
        console.error('Error loading installment options:', error);
        // Default options including 1 month
        this.installmentOptions = [
          { months: 1, label: '1 Month', interest_rate: 1, is_active: true },
          { months: 2, label: '2 Months', interest_rate: 3, is_active: true },
          { months: 3, label: '3 Months', interest_rate: 5, is_active: true },
          { months: 4, label: '4 Months', interest_rate: 7, is_active: true },
          { months: 5, label: '5 Months', interest_rate: 9, is_active: true },
          { months: 6, label: '6 Months', interest_rate: 12, is_active: true }
        ];
      }
    });
  }

  calculateInstallment(product: Product, months: number): void {
    this.isCalculating = true;
    
    this.customerService.calculateInstallmentPlan({
      product_price: product.price,
      number_of_installments: months,
      quantity: this.purchaseForm.value.quantity
    }).subscribe({
      next: (response: InstallmentCalculation) => {
        this.calculation = response;
        this.isCalculating = false;
      },
      error: (error) => {
        console.error('Error calculating installment:', error);
        this.calculateManually(product, months);
      }
    });
  }

  calculateManually(product: Product, months: number): void {
    const quantity = this.purchaseForm.value.quantity || 1;
    const totalPrice = product.price * quantity;
    const serviceFee = 0;
    const lateFeePercentage = 10;
    
    // For 1 month: No down payment, single payment after 1 month
    // For 2+ months: 40% down payment, monthly installments
    const downPaymentPercentage = months === 1 ? 0 : 40;
    const downPaymentAmount = totalPrice * (downPaymentPercentage / 100);
    const remainingBalance = totalPrice - downPaymentAmount + serviceFee;
    
    let installmentAmount = 0;
    let remainingInstallments = months === 1 ? 1 : months - 1;
    let totalInstallments = months === 1 ? 1 : months;
    
    if (months === 1) {
      // Single payment after 1 month
      installmentAmount = remainingBalance;
    } else {
      // Multiple months: divide remaining balance
      installmentAmount = remainingBalance / remainingInstallments;
    }
    
    const totalPayable = totalPrice + serviceFee;
    
    // Generate payment schedule
    const paymentSchedule: PaymentSchedule[] = [];
    const currentDate = new Date();
    
    if (months === 1) {
      // 1-month plan: Single payment due in 1 month
      const dueDate = new Date(currentDate);
      dueDate.setMonth(dueDate.getMonth() + 1);
      paymentSchedule.push({
        installment_number: 1,
        amount: installmentAmount,
        due_date: dueDate.toISOString(),
        status: 'pending',
        description: `Full Payment - Due in 1 month`
      });
    } else {
      // 2+ months: Down payment + monthly installments
      paymentSchedule.push({
        installment_number: 1,
        amount: downPaymentAmount,
        due_date: currentDate.toISOString(),
        status: 'due_now',
        description: `Down Payment (${downPaymentPercentage}% upfront)`
      });
      
      for (let i = 1; i <= remainingInstallments; i++) {
        const dueDate = new Date(currentDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        paymentSchedule.push({
          installment_number: i + 1,
          amount: installmentAmount,
          due_date: dueDate.toISOString(),
          status: 'pending',
          description: `Installment ${i + 1} of ${months}`
        });
      }
    }
    
    this.calculation = {
      product_price: totalPrice,
      down_payment: {
        percentage: downPaymentPercentage,
        amount: downPaymentAmount
      },
      remaining_balance: remainingBalance,
      installment_details: {
        total_installments: totalInstallments,
        remaining_installments: remainingInstallments,
        installment_amount: installmentAmount
      },
      fees: {
        service_fee: serviceFee,
        merchant_fee_percentage: 10,
        merchant_fee_amount: totalPrice * 0.1,
        late_fee_percentage: lateFeePercentage
      },
      totals: {
        total_payable: totalPayable,
        merchant_payout: totalPrice * 0.9
      },
      payment_schedule: paymentSchedule
    };
  }

  // ============================================
  // PRODUCT ACTIONS
  // ============================================

  viewProduct(product: Product): void {
    this.selectedProduct = product;
    this.purchaseForm.patchValue({ quantity: 1, selected_installments: 4 });
    this.showProductModal = true;
    this.calculateInstallment(product, 4);
  }

  selectInstallment(months: number): void {
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
    
    const months = this.purchaseForm.value.selected_installments || 4;
    this.calculateInstallment(this.selectedProduct, months);
  }

  openCheckout(): void {
    if (!this.selectedProduct || !this.calculation) return;
    this.showCheckoutModal = true;
  }

  placeOrder(): void {
    if (this.purchaseForm.invalid) return;
    
    this.isPurchasing = true;
    
    const orderData = {
      product_id: this.selectedProduct?.id,
      product_name: this.selectedProduct?.name,
      product_price: this.selectedProduct?.price,
      merchant_id: this.selectedProduct?.merchant_id,
      merchant_name: this.selectedProduct?.merchant_name,
      quantity: this.purchaseForm.value.quantity,
      number_of_installments: this.purchaseForm.value.selected_installments,
      delivery_address: this.purchaseForm.value.delivery_address,
      down_payment_amount: this.calculation?.down_payment.amount,
      installment_amount: this.calculation?.installment_details.installment_amount,
      total_payable: this.calculation?.totals.total_payable,
      payment_schedule: this.calculation?.payment_schedule
    };
    
    this.customerService.createPurchaseOrder(orderData).subscribe({
      next: (response) => {
        this.isPurchasing = false;
        this.showCheckoutModal = false;
        this.showProductModal = false;
        alert('Order placed successfully! Waiting for admin approval.');
        this.router.navigate(['/customer/orders']);
      },
      error: (error) => {
        console.error('Error placing order:', error);
        this.isPurchasing = false;
        alert('Failed to place order. Please try again.');
      }
    });
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
    this.selectedProduct = null;
    this.calculation = null;
    this.purchaseForm.patchValue({
      selected_installments: 4,
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