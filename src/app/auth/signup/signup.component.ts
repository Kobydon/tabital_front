import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  activeTab: string = 'customer';
  isLoading = false;

  customerForm: FormGroup;
  merchantForm: FormGroup;

  // URL validation pattern
  urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

  constructor(
    private fb: FormBuilder, 
    private auth: AuthService,
    private router: Router
  ) {
    // Initialize forms in constructor
    this.customerForm = this.createCustomerForm();
    this.merchantForm = this.createMerchantForm();
  }

  ngOnInit() {
    // Set up conditional validators after form initialization
    this.setupConditionalValidators();
  }

  createCustomerForm(): FormGroup {
    return this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
      dob: ['', Validators.required],
      national_id: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', Validators.required],
      gps: [''],
      address: ['', Validators.required],
      designation: [''],
      company: [''],
      income_range: ['', Validators.required],
      product_name: ['', Validators.required],
      total_price: ['', [Validators.required, Validators.min(1)]],
      payment_plan: ['', Validators.required],
      payment_frequency: ['', Validators.required],
      ref_name: ['', Validators.required],
      ref_phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
      ref_relationship: ['', Validators.required],
      agree: [false, Validators.requiredTrue],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  createMerchantForm(): FormGroup {
    return this.fb.group({
      // Business Information
      business_name: ['', [Validators.required, Validators.minLength(2)]],
      owner_name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
      city: ['', Validators.required],
      address: ['', Validators.required],
      
      // Business Details
      product_type: ['', Validators.required],
      has_shop: ['', Validators.required],
      shop_url: [''],
      years_in_business: ['', Validators.required],
      
      // Business Operations
      offers_credit: ['', Validators.required],
      price_range: ['', Validators.required],
      
      // Additional Business Fields
      business_type: [''],
      registration_number: [''],
      tax_id: [''],
      business_address: [''],
      business_phone: [''],
      business_email: ['', Validators.email],
      website: [''],
      description: [''],
      total_products: [0],
      total_sales: [0],
      rating: [0],
      
      // Payment Details
      payment_method: ['', Validators.required],
      momo_name: [''],
      momo_number: [''],
      bank_name: [''],
      account_name: [''],
      account_number: [''],
      
      // Account Security
      agree: [false, Validators.requiredTrue],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  setupConditionalValidators() {
    // Update validation when has_shop changes
    this.merchantForm.get('has_shop')?.valueChanges.subscribe(value => {
      const shopUrlControl = this.merchantForm.get('shop_url');
      if (value === 'yes') {
        shopUrlControl?.setValidators([Validators.required, this.urlValidator.bind(this)]);
        shopUrlControl?.updateValueAndValidity();
      } else {
        shopUrlControl?.clearValidators();
        shopUrlControl?.setValue('');
        shopUrlControl?.updateValueAndValidity();
      }
    });

    // Add conditional validations for payment methods
    this.merchantForm.get('payment_method')?.valueChanges.subscribe(value => {
      const momoName = this.merchantForm.get('momo_name');
      const momoNumber = this.merchantForm.get('momo_number');
      const bankName = this.merchantForm.get('bank_name');
      const accountName = this.merchantForm.get('account_name');
      const accountNumber = this.merchantForm.get('account_number');

      if (value === 'Mobile Money' || value === 'Both') {
        momoName?.setValidators([Validators.required]);
        momoNumber?.setValidators([Validators.required, Validators.pattern('^[0-9]{10,15}$')]);
      } else {
        momoName?.clearValidators();
        momoNumber?.clearValidators();
        momoName?.setValue('');
        momoNumber?.setValue('');
      }

      if (value === 'Bank Transfer' || value === 'Both') {
        bankName?.setValidators([Validators.required]);
        accountName?.setValidators([Validators.required]);
        accountNumber?.setValidators([Validators.required]);
      } else {
        bankName?.clearValidators();
        accountName?.clearValidators();
        accountNumber?.clearValidators();
        bankName?.setValue('');
        accountName?.setValue('');
        accountNumber?.setValue('');
      }

      momoName?.updateValueAndValidity();
      momoNumber?.updateValueAndValidity();
      bankName?.updateValueAndValidity();
      accountName?.updateValueAndValidity();
      accountNumber?.updateValueAndValidity();
    });
  }

  // Custom URL validator
  urlValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const isValid = this.urlPattern.test(control.value);
    return isValid ? null : { invalidUrl: true };
  }

  switchTab(tab: string) {
    this.activeTab = tab;
    this.isLoading = false;
  }

  submitCustomer() {
    // Mark all fields as touched to show validation errors
    this.customerForm.markAllAsTouched();
    
    if (this.customerForm.invalid) {
      console.log('Customer Form Errors:', this.getFormErrors());
      this.scrollToFirstError();
      return;
    }

    this.isLoading = true;
    const customerData = {
      ...this.customerForm.value,
      role: 'customer'
    };

    this.auth.register(customerData).subscribe({
      next: (res: any) => {
        console.log('Customer registered successfully', res);
        this.isLoading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Registration failed', err);
        this.isLoading = false;
        alert('Registration failed. Please try again.');
      }
    });
  }

  submitMerchant() {
    // Mark all fields as touched to show validation errors
    this.merchantForm.markAllAsTouched();
    
    if (this.merchantForm.invalid) {
      console.log('Merchant Form Errors:', this.getFormErrors());
      this.scrollToFirstError();
      return;
    }

    this.isLoading = true;
    const merchantData = {
      ...this.merchantForm.value,
      role: 'merchant'
    };

    this.auth.register(merchantData).subscribe({
      next: (res: any) => {
        console.log('Merchant registered successfully', res);
        this.isLoading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Registration failed', err);
        this.isLoading = false;
        alert('Registration failed. Please try again.');
      }
    });
  }

  // Helper method to check if shop URL is required and shown
  showShopUrl(): boolean {
    return this.merchantForm?.get('has_shop')?.value === 'yes';
  }

  // Helper method to check if payment method requires momo fields
  showMomoFields(): boolean {
    const paymentMethod = this.merchantForm?.get('payment_method')?.value;
    return paymentMethod === 'Mobile Money' || paymentMethod === 'Both';
  }

  // Helper method to check if payment method requires bank fields
  showBankFields(): boolean {
    const paymentMethod = this.merchantForm?.get('payment_method')?.value;
    return paymentMethod === 'Bank Transfer' || paymentMethod === 'Both';
  }

  // Get all form errors for debugging
  getFormErrors(): string[] {
    const errors: string[] = [];
    if (this.activeTab === 'customer' && this.customerForm) {
      Object.keys(this.customerForm.controls).forEach(key => {
        const control = this.customerForm.get(key);
        if (control?.invalid) {
          errors.push(`${key}: ${JSON.stringify(control.errors)}`);
        }
      });
    } else if (this.merchantForm) {
      Object.keys(this.merchantForm.controls).forEach(key => {
        const control = this.merchantForm.get(key);
        if (control?.invalid) {
          errors.push(`${key}: ${JSON.stringify(control.errors)}`);
        }
      });
    }
    return errors;
  }

  // Scroll to first error field
  private scrollToFirstError(): void {
    setTimeout(() => {
      const firstError = document.querySelector('.ng-invalid.ng-touched');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
}