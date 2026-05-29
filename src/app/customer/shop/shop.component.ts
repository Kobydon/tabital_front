import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../../customers.service';
import { Router } from '@angular/router';
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
    this.router.navigate(['/customer/documents']);
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
      { months: 2, label: '2 Months - 50% Down, 50% Later', interest_rate: 0, is_active: true },
      { months: 3, label: '3 Months - 50% Down, 50% Remaining', interest_rate: 0, is_active: true },
      { months: 4, label: '4 Months - 40% Down', interest_rate: 0, is_active: true },
      { months: 6, label: '6 Months', interest_rate: 0, is_active: false, coming_soon: true }
    ];
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
    const deliveryFee = 50; // GHS 50 delivery fee
    const subtotal = totalPrice;
    
    let downPaymentPercentage = 0;
    let downPaymentAmount = 0;
    let remainingBalanceAfterDown = 0;
    let totalInstallments = 0;
    let remainingInstallments = 0;
    let installmentAmount = 0;
    
    // Calculate total with delivery fee
    const totalWithDelivery = subtotal + deliveryFee;
    
    if (months === 1) {
      // 1 Installment: Down Payment (Full Payment) = 100% of product cost
      downPaymentPercentage = 100;
      downPaymentAmount = totalPrice;
      remainingBalanceAfterDown = 0;
      totalInstallments = 1;
      remainingInstallments = 0;
      installmentAmount = 0;
      
      const totalPayable = totalWithDelivery + serviceFee;
      
      const paymentSchedule: PaymentSchedule[] = [];
      const currentDate = new Date();
      
      paymentSchedule.push({
        installment_number: 1,
        amount: downPaymentAmount + deliveryFee,
        due_date: currentDate.toISOString(),
        status: 'due_now',
        description: `Full Payment (100% upfront) + Delivery Fee`
      });
      
      this.calculation = {
        product_price: totalPrice,
        down_payment: {
          percentage: downPaymentPercentage,
          amount: downPaymentAmount + deliveryFee
        },
        remaining_balance: remainingBalanceAfterDown,
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
      this.isCalculating = false;
      return;
    }
    
    if (months === 2) {
      // 2 Installments: Down Payment = 50% of product price, then remaining 50%
      downPaymentPercentage = 50;
      downPaymentAmount = totalPrice * 0.5;
      remainingBalanceAfterDown = totalPrice - downPaymentAmount;
      totalInstallments = 2;
      remainingInstallments = 1;
      installmentAmount = remainingBalanceAfterDown / remainingInstallments;
      
      const totalPayable = totalWithDelivery + serviceFee;
      
      const paymentSchedule: PaymentSchedule[] = [];
      const currentDate = new Date();
      
      paymentSchedule.push({
        installment_number: 1,
        amount: downPaymentAmount + deliveryFee,
        due_date: currentDate.toISOString(),
        status: 'due_now',
        description: `Down Payment (50% of product price) + Delivery Fee`
      });
      
      const secondDueDate = new Date(currentDate);
      secondDueDate.setMonth(secondDueDate.getMonth() + 1);
      paymentSchedule.push({
        installment_number: 2,
        amount: installmentAmount,
        due_date: secondDueDate.toISOString(),
        status: 'pending',
        description: `Final Payment (Remaining 50%)`
      });
      
      this.calculation = {
        product_price: totalPrice,
        down_payment: {
          percentage: downPaymentPercentage,
          amount: downPaymentAmount + deliveryFee
        },
        remaining_balance: remainingBalanceAfterDown,
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
      this.isCalculating = false;
      return;
    }
    
    if (months === 3) {
      // 3 Installments: Down Payment = 50% of product price, remaining 50% split into 2 payments of 25% each
      downPaymentPercentage = 50;
      downPaymentAmount = totalPrice * 0.5;
      const remainingAmount = totalPrice - downPaymentAmount;
      const subsequentPaymentAmount = remainingAmount / 2; // 25% each
      
      totalInstallments = 3;
      remainingInstallments = 2;
      
      const totalPayable = totalWithDelivery + serviceFee;
      
      const paymentSchedule: PaymentSchedule[] = [];
      const currentDate = new Date();
      
      paymentSchedule.push({
        installment_number: 1,
        amount: downPaymentAmount + deliveryFee,
        due_date: currentDate.toISOString(),
        status: 'due_now',
        description: `Down Payment (50% of product price) + Delivery Fee`
      });
      
      const secondDueDate = new Date(currentDate);
      secondDueDate.setMonth(secondDueDate.getMonth() + 1);
      paymentSchedule.push({
        installment_number: 2,
        amount: subsequentPaymentAmount,
        due_date: secondDueDate.toISOString(),
        status: 'pending',
        description: `Second Payment (25% of product price)`
      });
      
      const thirdDueDate = new Date(currentDate);
      thirdDueDate.setMonth(thirdDueDate.getMonth() + 2);
      paymentSchedule.push({
        installment_number: 3,
        amount: subsequentPaymentAmount,
        due_date: thirdDueDate.toISOString(),
        status: 'pending',
        description: `Final Payment (25% of product price)`
      });
      
      this.calculation = {
        product_price: totalPrice,
        down_payment: {
          percentage: downPaymentPercentage,
          amount: downPaymentAmount + deliveryFee
        },
        remaining_balance: remainingAmount,
        installment_details: {
          total_installments: totalInstallments,
          remaining_installments: remainingInstallments,
          installment_amount: subsequentPaymentAmount
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
      this.isCalculating = false;
      return;
    }
    
    if (months === 4) {
      // 4 Installments: Down Payment = 40% of product price, remaining 60% split into 3 equal payments of 20% each
      downPaymentPercentage = 40;
      downPaymentAmount = totalPrice * 0.4;
      remainingBalanceAfterDown = totalPrice - downPaymentAmount;
      totalInstallments = 4;
      remainingInstallments = 3;
      installmentAmount = remainingBalanceAfterDown / remainingInstallments;
      
      const totalPayable = totalWithDelivery + serviceFee;
      
      const paymentSchedule: PaymentSchedule[] = [];
      const currentDate = new Date();
      
      paymentSchedule.push({
        installment_number: 1,
        amount: downPaymentAmount + deliveryFee,
        due_date: currentDate.toISOString(),
        status: 'due_now',
        description: `Down Payment (40% of product price) + Delivery Fee`
      });
      
      for (let i = 1; i <= remainingInstallments; i++) {
        const dueDate = new Date(currentDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        paymentSchedule.push({
          installment_number: i + 1,
          amount: installmentAmount,
          due_date: dueDate.toISOString(),
          status: 'pending',
          description: `Installment ${i + 1} of ${months} (20% of product price)`
        });
      }
      
      this.calculation = {
        product_price: totalPrice,
        down_payment: {
          percentage: downPaymentPercentage,
          amount: downPaymentAmount + deliveryFee
        },
        remaining_balance: remainingBalanceAfterDown,
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
    
    this.isCalculating = false;
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
      alert(`${option.label} is coming soon! Please select another payment plan.`);
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

  openCheckout(): void {
    if (this.isKYCPending) {
      this.showKYCBlockedModal();
      return;
    }
    
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
  // Add this method to calculate Due Now amount including delivery fee
// Add this method to calculate Due Now amount including delivery fee
getDueNowAmount(productPrice: number, months: number): number {
  let downPaymentPercentage = 0;
  
  switch(months) {
    case 1:
      downPaymentPercentage = 100;
      break;
    case 2:
    case 3:
      downPaymentPercentage = 50;
      break;
    case 4:
      downPaymentPercentage = 40;
      break;
    default:
      downPaymentPercentage = 0;
  }
  
  const downPaymentAmount = productPrice * downPaymentPercentage / 100;
  const deliveryFee = 50;
  
  return downPaymentAmount + deliveryFee;
}
}