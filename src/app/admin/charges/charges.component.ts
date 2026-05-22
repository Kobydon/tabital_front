// src/app/admin/components/charges/charges.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../admin.service';
// import { AdminService } from '../../admin.service';

export interface ChargeSettings {
  id: number;
  down_payment_percentage: number;
  merchant_fee_percentage: number;
  late_fee_percentage: number;
  service_fee: number;
  min_installments: number;
  max_installments: number;
  default_installments: number;
  late_fee_grace_period_days: number;
  updated_at: string;
  updated_by: string;
}

export interface InstallmentOption {
  months: number;
  label: string;
  interest_rate: number;
  is_active: boolean;
}

@Component({
  selector: 'app-charges',
  templateUrl: './charges.component.html',
  styleUrls: ['./charges.component.scss']
})
export class ChargesComponent implements OnInit {
  // Data
  chargeSettings: ChargeSettings | null = null;
  installmentOptions: InstallmentOption[] = [];
  activityLog: any[] = [];
  
  // UI State
  isLoading = true;
  isSaving = false;
  activeTab: 'general' | 'installments' | 'history' = 'general';
  
  // Forms
  generalForm: FormGroup;
  installmentForm: FormGroup;
  
  // Success/Error Messages
  successMessage = '';
  errorMessage = '';
  
  // Constants
  readonly DEFAULT_SETTINGS = {
    down_payment_percentage: 40,
    merchant_fee_percentage: 10,
    late_fee_percentage: 10,
    service_fee: 0,
    min_installments: 2,
    max_installments: 24,
    default_installments: 4,
    late_fee_grace_period_days: 3
  };

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.generalForm = this.fb.group({
      down_payment_percentage: [40, [Validators.required, Validators.min(0), Validators.max(100)]],
      merchant_fee_percentage: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
      late_fee_percentage: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
      service_fee: [0, [Validators.required, Validators.min(0)]],
      late_fee_grace_period_days: [3, [Validators.required, Validators.min(0), Validators.max(30)]]
    });
    
    this.installmentForm = this.fb.group({
      min_installments: [2, [Validators.required, Validators.min(2), Validators.max(6)]],
      max_installments: [24, [Validators.required, Validators.min(6), Validators.max(48)]],
      default_installments: [4, [Validators.required, Validators.min(2), Validators.max(24)]]
    });
  }

  ngOnInit(): void {
    this.loadChargeSettings();
    this.loadInstallmentOptions();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadChargeSettings(): void {
    this.isLoading = true;
    
    this.adminService.getChargeSettings().subscribe({
      next: (response: any) => {
        this.chargeSettings = response;
        this.populateForms(response);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading charge settings:', error);
        // Use default settings
        this.populateForms(this.DEFAULT_SETTINGS);
        this.isLoading = false;
      }
    });
  }

  loadInstallmentOptions(): void {
    // Sample installment options - in production, fetch from API
    this.installmentOptions = [
      { months: 2, label: '2 Months', interest_rate: 3, is_active: true },
      { months: 3, label: '3 Months', interest_rate: 5, is_active: true },
      { months: 4, label: '4 Months', interest_rate: 7, is_active: true },
      { months: 6, label: '6 Months', interest_rate: 10, is_active: true },
      { months: 9, label: '9 Months', interest_rate: 13, is_active: true },
      { months: 12, label: '12 Months', interest_rate: 16, is_active: true },
      { months: 18, label: '18 Months', interest_rate: 22, is_active: true },
      { months: 24, label: '24 Months', interest_rate: 28, is_active: true }
    ];
  }

  private populateForms(settings: any): void {
    this.generalForm.patchValue({
      down_payment_percentage: settings.down_payment_percentage || 40,
      merchant_fee_percentage: settings.merchant_fee_percentage || 10,
      late_fee_percentage: settings.late_fee_percentage || 10,
      service_fee: settings.service_fee || 0,
      late_fee_grace_period_days: settings.late_fee_grace_period_days || 3
    });
    
    this.installmentForm.patchValue({
      min_installments: settings.min_installments || 2,
      max_installments: settings.max_installments || 24,
      default_installments: settings.default_installments || 4
    });
  }

  // ============================================
  // SAVE ACTIONS
  // ============================================

  saveGeneralSettings(): void {
    if (this.generalForm.invalid) {
      this.showError('Please fill all required fields correctly');
      return;
    }
    
    this.isSaving = true;
    this.clearMessages();
    
    const settings = {
      ...this.generalForm.value,
      min_installments: this.installmentForm.value.min_installments,
      max_installments: this.installmentForm.value.max_installments,
      default_installments: this.installmentForm.value.default_installments
    };
    
    this.adminService.updateChargeSettings(settings).subscribe({
      next: (response) => {
        this.showSuccess('Charge settings saved successfully!');
        this.isSaving = false;
        this.loadChargeSettings();
      },
      error: (error) => {
        console.error('Error saving settings:', error);
        this.showError('Failed to save settings. Please try again.');
        this.isSaving = false;
      }
    });
  }

  saveInstallmentOptions(): void {
    this.isSaving = true;
    this.clearMessages();
    
    this.adminService.updateInstallmentOptions(this.installmentOptions).subscribe({
      next: (response) => {
        this.showSuccess('Installment options saved successfully!');
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error saving installment options:', error);
        this.showError('Failed to save installment options. Please try again.');
        this.isSaving = false;
      }
    });
  }

  resetToDefault(): void {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      this.populateForms(this.DEFAULT_SETTINGS);
      this.showSuccess('Settings reset to default. Click Save to apply changes.');
    }
  }

  // ============================================
  // INSTALLMENT OPTIONS MANAGEMENT
  // ============================================

  toggleInstallmentOption(option: InstallmentOption): void {
    option.is_active = !option.is_active;
  }

  updateInterestRate(option: InstallmentOption, event: any): void {
    const newRate = parseFloat(event.target.value);
    if (!isNaN(newRate) && newRate >= 0 && newRate <= 100) {
      option.interest_rate = newRate;
    }
  }

  // ============================================
  // UI HELPERS
  // ============================================

  switchTab(tab: 'general' | 'installments' | 'history'): void {
    this.activeTab = tab;
    this.clearMessages();
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.clearMessages(), 5000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.clearMessages(), 5000);
  }

  // ============================================
  // PREVIEW CALCULATIONS
  // ============================================

  calculatePreview(productPrice: number = 1000): any {
    const downPayment = productPrice * (this.generalForm.value.down_payment_percentage / 100);
    const merchantFee = productPrice * (this.generalForm.value.merchant_fee_percentage / 100);
    const merchantPayout = productPrice - merchantFee;
    const remainingBalance = productPrice - downPayment;
    const defaultInstallments = this.installmentForm.value.default_installments;
    const installmentAmount = remainingBalance / (defaultInstallments - 1);
    
    return {
      product_price: productPrice,
      down_payment: downPayment,
      merchant_fee: merchantFee,
      merchant_payout: merchantPayout,
      remaining_balance: remainingBalance,
      installment_amount: installmentAmount,
      total_installments: defaultInstallments,
      late_fee: productPrice * (this.generalForm.value.late_fee_percentage / 100)
    };
  }
}