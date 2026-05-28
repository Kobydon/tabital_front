// signup.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit, OnDestroy {
  activeTab: string = 'customer';
  isLoading = false;
  
  serverErrors: { [key: string]: string } = {};
  generalError: string = '';

  customerForm: FormGroup;
  merchantForm: FormGroup;

  // For real-time checking
  private destroy$ = new Subject<void>();
  private checkingEmail = false;
  private checkingPhone = false;

  // URL validation pattern
  urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

  // Ghana mobile number pattern
  private readonly GHANA_MOBILE_PATTERN = /^(054|055|059|020|024|025|026|027|050|053|057|056)[0-9]{7}$/;
  
  // Invalid/blocked mobile number prefixes
  private readonly INVALID_MOBILE_PREFIXES = [
    '000', '111', '222', '333', '444', '555', '666', '777', '888', '999',
    '123', '456', '789', '0000000000', '1234567890'
  ];

  // Weak password patterns to block
  private readonly WEAK_PASSWORD_PATTERNS = [
    /^123456$/, /^password$/i, /^qwerty$/i, /^abc123$/i, /^admin$/i,
    /^welcome$/i, /^letmein$/i, /^passw0rd$/i, /^iloveyou$/i, /^admin123$/i,
    /^user$/i, /^test$/i, /^guest$/i, /^12345$/, /^12345678$/, /^123456789$/,
    /^000000$/, /^111111$/, /^222222$/, /^333333$/, /^444444$/, /^555555$/,
    /^666666$/, /^777777$/, /^888888$/, /^999999$/, /^012345$/, /^987654$/
  ];

  constructor(
    private fb: FormBuilder, 
    private auth: AuthService,
    private router: Router
  ) {
    this.customerForm = this.createCustomerForm();
    this.merchantForm = this.createMerchantForm();
  }

  ngOnInit() {
    this.setupConditionalValidators();
    this.setupRealtimeDuplicateCheck();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // REAL-TIME DUPLICATE CHECKING
  // ============================================

  setupRealtimeDuplicateCheck() {
    // Check for customer form
    const customerEmailControl = this.customerForm.get('business_email');
    const customerPhoneControl = this.customerForm.get('phone');
    
    if (customerEmailControl) {
      customerEmailControl.valueChanges.pipe(
        debounceTime(800),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      ).subscribe(email => {
        if (email && customerEmailControl.valid && !this.checkingEmail) {
          const phone = customerPhoneControl?.value || '';
          this.checkDuplicate(email, phone, 'customer');
        }
      });
    }
    
    if (customerPhoneControl) {
      customerPhoneControl.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      ).subscribe(phone => {
        if (phone && customerPhoneControl.valid && !this.checkingPhone) {
          const email = customerEmailControl?.value || '';
          this.checkDuplicate(email, phone, 'customer');
        }
      });
    }
    
    // Check for merchant form
    const merchantEmailControl = this.merchantForm.get('business_email');
    const merchantPhoneControl = this.merchantForm.get('phone');
    
    if (merchantEmailControl) {
      merchantEmailControl.valueChanges.pipe(
        debounceTime(800),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      ).subscribe(email => {
        if (email && merchantEmailControl.valid && !this.checkingEmail) {
          const phone = merchantPhoneControl?.value || '';
          this.checkDuplicate(email, phone, 'merchant');
        }
      });
    }
    
    if (merchantPhoneControl) {
      merchantPhoneControl.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      ).subscribe(phone => {
        if (phone && merchantPhoneControl.valid && !this.checkingPhone) {
          const email = merchantEmailControl?.value || '';
          this.checkDuplicate(email, phone, 'merchant');
        }
      });
    }
  }

  checkDuplicate(email: string, phone: string, formType: 'customer' | 'merchant') {
    if (!email && !phone) return;
    
    const form = formType === 'customer' ? this.customerForm : this.merchantForm;
    
    // Clear previous duplicate errors
    if (email) {
      const emailControl = form.get('business_email');
      if (emailControl?.errors) {
        const { emailAlreadyExists, ...otherErrors } = emailControl.errors;
        emailControl.setErrors(Object.keys(otherErrors).length ? otherErrors : null);
      }
    }
    
    if (phone) {
      const phoneControl = form.get('phone');
      if (phoneControl?.errors) {
        const { phoneAlreadyExists, ...otherErrors } = phoneControl.errors;
        phoneControl.setErrors(Object.keys(otherErrors).length ? otherErrors : null);
      }
    }
    
    this.auth.checkUserExists(email, phone).subscribe({
      next: (response) => {
        if (response.email_exists && email) {
          const emailControl = form.get('business_email');
          if (emailControl && email === emailControl.value) {
            const currentErrors = emailControl.errors || {};
            emailControl.setErrors({ ...currentErrors, emailAlreadyExists: true });
            this.serverErrors['business_email'] = response.email_message;
            this.showDuplicateAlert('email', email);
          }
        }
        
        if (response.phone_exists && phone) {
          const phoneControl = form.get('phone');
          if (phoneControl && phone === phoneControl.value) {
            const currentErrors = phoneControl.errors || {};
            phoneControl.setErrors({ ...currentErrors, phoneAlreadyExists: true });
            this.serverErrors['phone'] = response.phone_message;
            this.showDuplicateAlert('phone', phone);
          }
        }
      },
      error: (error) => {
        console.error('Error checking user existence:', error);
      }
    });
  }

  showDuplicateAlert(fieldType: 'email' | 'phone', value: string) {
    const alertMessage = fieldType === 'email' 
      ? `⚠️ This email (${value}) is already registered.\n\nDo you want to login instead?`
      : `⚠️ This phone number (${value}) is already registered.\n\nDo you want to login instead?`;
    
    const userConfirmed = confirm(alertMessage + '\n\nClick OK to go to login page, Cancel to continue with registration.');
    
    if (userConfirmed) {
      this.router.navigate(['/login']);
    }
  }

  // ============================================
  // CUSTOM VALIDATORS
  // ============================================

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  validMobileNumberValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    
    const value = control.value.toString().trim();
    
    if (!this.GHANA_MOBILE_PATTERN.test(value)) {
      return { invalidMobileNumber: true };
    }
    
    for (const prefix of this.INVALID_MOBILE_PREFIXES) {
      if (value.startsWith(prefix) || value === prefix) {
        return { blockedMobileNumber: true };
      }
    }
    
    if (/^(\d)\1{9}$/.test(value)) {
      return { invalidMobileNumber: true };
    }
    
    let isSequential = true;
    for (let i = 1; i < value.length; i++) {
      if (Math.abs(parseInt(value[i]) - parseInt(value[i-1])) !== 1) {
        isSequential = false;
        break;
      }
    }
    if (isSequential && value.length >= 8) {
      return { invalidMobileNumber: true };
    }
    
    return null;
  }

  strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    
    const password = control.value.toString();
    
    if (password.length < 6) {
      return { passwordTooShort: true };
    }
    
    if (password.length > 128) {
      return { passwordTooLong: true };
    }
    
    for (const pattern of this.WEAK_PASSWORD_PATTERNS) {
      if (pattern.test(password)) {
        return { weakPassword: true };
      }
    }
    
    if (/^\d+$/.test(password)) {
      return { weakPassword: true };
    }
    
    if (/^[a-zA-Z]+$/.test(password)) {
      return { weakPassword: true };
    }
    
    if (/(.)\1{5,}/.test(password)) {
      return { weakPassword: true };
    }
    
    if (password.length >= 8) {
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      const complexityCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars].filter(Boolean).length;
      if (complexityCount < 2 && password.length < 10) {
        return { weakPasswordSuggestion: true };
      }
    }
    
    return null;
  }

  urlValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const isValid = this.urlPattern.test(control.value);
    return isValid ? null : { invalidUrl: true };
  }

  // ============================================
  // FORM CREATION
  // ============================================

  createCustomerForm(): FormGroup {
    return this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      business_email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, this.validMobileNumberValidator.bind(this)]],
      dob: ['', Validators.required],
      city: ['', Validators.required],
      gps: [''],
      address: ['', Validators.required],
      designation: [''],
      company: [''],
      income_range: ['', Validators.required],
      ref_name: ['', Validators.required],
      ref_phone: ['', [Validators.required, this.validMobileNumberValidator.bind(this)]],
      ref_relationship: ['', Validators.required],
      agree: [false, Validators.requiredTrue],
      password: ['', [Validators.required, this.strongPasswordValidator.bind(this)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  createMerchantForm(): FormGroup {
    return this.fb.group({
      business_name: ['', [Validators.required, Validators.minLength(2)]],
      owner_name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, this.validMobileNumberValidator.bind(this)]],
      city: ['', Validators.required],
      address: ['', Validators.required],
      product_type: ['', Validators.required],
      has_shop: [''],
      shop_url: [''],
      years_in_business: ['', Validators.required],
      business_type: [''],
      business_address: [''],
      business_phone: ['', this.validMobileNumberValidator.bind(this)],
      business_email: ['', Validators.email],
      description: [''],
      agree: [false, Validators.requiredTrue],
      password: ['', [Validators.required, this.strongPasswordValidator.bind(this)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  setupConditionalValidators() {
    this.merchantForm.get('has_shop')?.valueChanges.subscribe(value => {
      const shopUrlControl = this.merchantForm.get('shop_url');
      if (value === 'no' || value === 'both') {
        shopUrlControl?.setValidators([Validators.required, this.urlValidator.bind(this)]);
        shopUrlControl?.updateValueAndValidity();
      } else {
        shopUrlControl?.clearValidators();
        shopUrlControl?.setValue('');
        shopUrlControl?.updateValueAndValidity();
      }
    });
  }

  // ============================================
  // TAB SWITCHING
  // ============================================

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.isLoading = false;
    this.serverErrors = {};
    this.generalError = '';
  }

  // ============================================
  // ERROR MESSAGE HELPERS
  // ============================================

  hasPasswordMismatch(form: FormGroup): boolean {
    return !!(form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched);
  }

  getMobileNumberErrorMessage(control: AbstractControl | null): string {
    if (!control) {
      return '';
    }
    
    if (control?.errors?.['invalidMobileNumber']) {
      return 'Please enter a valid Ghana mobile number (e.g., 024XXXXXXX)';
    }
    if (control?.errors?.['blockedMobileNumber']) {
      return 'This mobile number is not allowed. Please use a valid personal mobile number.';
    }
    if (control?.errors?.['required']) {
      return 'Mobile number is required';
    }
    if (control?.errors?.['phoneAlreadyExists']) {
      return '⚠️ This phone number is already registered. Please use a different number or login.';
    }
    return 'Valid mobile number required';
  }

  getPasswordErrorMessage(control: AbstractControl | null): string {
    if (!control) {
      return '';
    }
    
    if (control?.errors?.['required']) {
      return 'Password is required';
    }
    if (control?.errors?.['passwordTooShort']) {
      return 'Password must be at least 6 characters';
    }
    if (control?.errors?.['passwordTooLong']) {
      return 'Password is too long (maximum 128 characters)';
    }
    if (control?.errors?.['weakPassword']) {
      return '⚠️ Password is too weak. Please choose a stronger password.';
    }
    if (control?.errors?.['weakPasswordSuggestion']) {
      return '💡 Tip: Use a mix of uppercase, lowercase, numbers, and special characters.';
    }
    return '';
  }

  getEmailErrorMessage(control: AbstractControl | null): string {
    if (!control) {
      return '';
    }
    
    if (control?.errors?.['required']) {
      return 'Email address is required';
    }
    if (control?.errors?.['email']) {
      return 'Please enter a valid email address';
    }
    if (control?.errors?.['emailAlreadyExists']) {
      return '⚠️ This email is already registered. Please use a different email or login.';
    }
    return '';
  }

  // ============================================
  // ENHANCED ERROR HANDLING FOR IntegrityError
  // ============================================

  clearServerError(field: string): void {
    delete this.serverErrors[field];
    this.generalError = '';
    
    const form = this.activeTab === 'customer' ? this.customerForm : this.merchantForm;
    const control = form.get(field);
    if (control?.errors?.['emailAlreadyExists']) {
      const errors = { ...control.errors };
      delete errors['emailAlreadyExists'];
      control.setErrors(Object.keys(errors).length ? errors : null);
    }
    if (control?.errors?.['phoneAlreadyExists']) {
      const errors = { ...control.errors };
      delete errors['phoneAlreadyExists'];
      control.setErrors(Object.keys(errors).length ? errors : null);
    }
  }

  private handleServerErrors(error: any): void {
    this.serverErrors = {};
    this.generalError = '';
    
    console.log('Full error object:', error);
    
    let errorMessage = '';
    let errorDetail = '';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (typeof error.error === 'string') {
      errorMessage = error.error;
    }
    
    if (error.error?.detail) {
      errorDetail = error.error.detail;
    } else if (error.detail) {
      errorDetail = error.detail;
    }
    
    const fullErrorText = (errorMessage + ' ' + errorDetail + ' ' + JSON.stringify(error)).toLowerCase();
    
    console.log('Full error text:', fullErrorText);
    
    if (fullErrorText.includes('integrityerror') || 
        fullErrorText.includes('uniqueviolation') || 
        fullErrorText.includes('duplicate key') ||
        fullErrorText.includes('already exists')) {
      
      if (fullErrorText.includes('business_email') || fullErrorText.includes('email')) {
        const form = this.activeTab === 'customer' ? this.customerForm : this.merchantForm;
        const emailControl = form.get('business_email');
        
        if (emailControl) {
          emailControl.setErrors({ ...emailControl.errors, emailAlreadyExists: true });
          this.serverErrors['business_email'] = 'This email address is already registered. Please use a different email or login.';
        }
      }
      
      if (fullErrorText.includes('phone') && fullErrorText.includes('duplicate')) {
        const form = this.activeTab === 'customer' ? this.customerForm : this.merchantForm;
        const phoneControl = form.get('phone');
        
        if (phoneControl) {
          phoneControl.setErrors({ ...phoneControl.errors, phoneAlreadyExists: true });
          this.serverErrors['phone'] = 'This phone number is already registered. Please use a different number or login.';
        }
      }
    }
    
    if (error.error && typeof error.error === 'object') {
      if (error.error.business_email) {
        const emailError = error.error.business_email;
        if (Array.isArray(emailError) && emailError[0]?.includes('already')) {
          const form = this.activeTab === 'customer' ? this.customerForm : this.merchantForm;
          const emailControl = form.get('business_email');
          if (emailControl) {
            emailControl.setErrors({ ...emailControl.errors, emailAlreadyExists: true });
            this.serverErrors['business_email'] = emailError[0];
          }
        } else if (typeof emailError === 'string' && emailError.includes('already')) {
          const form = this.activeTab === 'customer' ? this.customerForm : this.merchantForm;
          const emailControl = form.get('business_email');
          if (emailControl) {
            emailControl.setErrors({ ...emailControl.errors, emailAlreadyExists: true });
            this.serverErrors['business_email'] = emailError;
          }
        }
      }
      
      if (error.error.phone) {
        const phoneError = error.error.phone;
        if (Array.isArray(phoneError) && phoneError[0]?.includes('already')) {
          const form = this.activeTab === 'customer' ? this.customerForm : this.merchantForm;
          const phoneControl = form.get('phone');
          if (phoneControl) {
            phoneControl.setErrors({ ...phoneControl.errors, phoneAlreadyExists: true });
            this.serverErrors['phone'] = phoneError[0];
          }
        } else if (typeof phoneError === 'string' && phoneError.includes('already')) {
          const form = this.activeTab === 'customer' ? this.customerForm : this.merchantForm;
          const phoneControl = form.get('phone');
          if (phoneControl) {
            phoneControl.setErrors({ ...phoneControl.errors, phoneAlreadyExists: true });
            this.serverErrors['phone'] = phoneError;
          }
        }
      }
    }
    
    if (Object.keys(this.serverErrors).length === 0 && errorMessage) {
      if (errorMessage.includes('email') && errorMessage.includes('already')) {
        this.serverErrors['business_email'] = errorMessage;
        const form = this.activeTab === 'customer' ? this.customerForm : this.merchantForm;
        const emailControl = form.get('business_email');
        if (emailControl) {
          emailControl.setErrors({ ...emailControl.errors, emailAlreadyExists: true });
        }
      } else if (errorMessage.includes('phone') && errorMessage.includes('already')) {
        this.serverErrors['phone'] = errorMessage;
        const form = this.activeTab === 'customer' ? this.customerForm : this.merchantForm;
        const phoneControl = form.get('phone');
        if (phoneControl) {
          phoneControl.setErrors({ ...phoneControl.errors, phoneAlreadyExists: true });
        }
      } else {
        this.generalError = errorMessage;
      }
    }
    
    if (Object.keys(this.serverErrors).length === 0 && !this.generalError) {
      this.generalError = 'Registration failed. The email or phone number may already be registered. Please try again.';
    }
  }

  // ============================================
  // FORM SUBMISSION
  // ============================================

  submitCustomer(): void {
    this.customerForm.markAllAsTouched();
    
    if (this.customerForm.invalid) {
      console.log('Customer Form Errors:', this.getFormErrors());
      this.scrollToFirstError();
      return;
    }

    this.isLoading = true;
    this.serverErrors = {};
    this.generalError = '';
    
    const customerData = {
      ...this.customerForm.value,
      role: 'customer'
    };
    
    delete customerData.confirmPassword;
    
    console.log('Submitting customer data:', customerData);

    this.auth.register(customerData).subscribe({
      next: (res: any) => {
        console.log('Customer registered successfully', res);
        this.isLoading = false;
        alert('Registration successful! Please login to continue.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        alert(err.message);
        this.isLoading = false;
        this.handleServerErrors(err);
        
        setTimeout(() => {
          const errorElement = document.querySelector('.duplicate-error, .error-text, .general-error');
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    });
  }

  submitMerchant(): void {
    this.merchantForm.markAllAsTouched();
    
    if (this.merchantForm.invalid) {
      console.log('Merchant Form Errors:', this.getFormErrors());
      this.scrollToFirstError();
      return;
    }

    this.isLoading = true;
    this.serverErrors = {};
    this.generalError = '';
    
    const merchantData = {
      ...this.merchantForm.value,
      role: 'merchant'
    };
    
    delete merchantData.confirmPassword;

    this.auth.register(merchantData).subscribe({
      next: (res: any) => {
        console.log('Merchant registered successfully', res);
        this.isLoading = false;
        alert('Registration successful! Please wait for admin approval.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Registration failed', err);
        this.isLoading = false;
        this.handleServerErrors(err);
        
        setTimeout(() => {
          const errorElement = document.querySelector('.duplicate-error, .error-text, .general-error');
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  showShopUrl(): boolean {
    const hasShop = this.merchantForm?.get('has_shop')?.value;
    return hasShop === 'no' || hasShop === 'both';
  }

  getFormErrors(): string[] {
    const errors: string[] = [];
    const form = this.activeTab === 'customer' ? this.customerForm : this.merchantForm;
    
    if (form) {
      Object.keys(form.controls).forEach(key => {
        const control = form.get(key);
        if (control?.invalid) {
          errors.push(`${key}: ${JSON.stringify(control.errors)}`);
        }
      });
      if (form.errors?.['passwordMismatch']) {
        errors.push('passwordMismatch: Passwords do not match');
      }
    }
    return errors;
  }

  private scrollToFirstError(): void {
    setTimeout(() => {
      const firstError = document.querySelector('.ng-invalid.ng-touched, .error-text, .duplicate-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
}