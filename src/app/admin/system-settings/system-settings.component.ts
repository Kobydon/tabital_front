// system-settings.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
// import { SystemSettingsService } from './system-settings.service';
// REMOVED: import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { SystemSettingsService } from 'src/app/system-settings.service';

@Component({
  selector: 'app-system-settings',
  templateUrl: './system-settings.component.html',
  styleUrls: ['./system-settings.component.scss']
})
export class SystemSettingsComponent implements OnInit, OnDestroy {
  settingsForm: FormGroup;
  installmentOptionsForm: FormGroup;
  
  // Dashboard stats
  stats = {
    activeGroups: 11,
    systemStatus: 'Operational',
    securityScore: 92,
    lastBackup: '20 May 2024, 03:15 AM',
    activeIntegrations: 8
  };
  
  // Recent changes
  recentChanges = [
    { action: 'Transaction limit updated', user: 'Admin User', date: '20 May 2024, 10:30 AM' },
    { action: 'New payout channel added', user: 'Admin User', date: '19 May 2024, 04:15 PM' },
    { action: 'KYC requirement updated', user: 'Admin User', date: '18 May 2024, 11:45 AM' },
    { action: 'Email notification template updated', user: 'Admin User', date: '17 May 2024, 02:20 PM' },
    { action: 'API rate limit updated', user: 'Admin User', date: '16 May 2024, 09:10 AM' }
  ];
  
  systemUptime = '99.98%';
  isLoading = false;
  private destroy$ = new Subject<void>();
  
  // Installment plan presets
  installmentPresets = [
    { months: 1, downPayment: 100, description: 'Full payment' },
    { months: 2, downPayment: 50, description: '50% down, 50% next month' },
    { months: 3, downPayment: 50, description: '50% down, 25% over 2 months' },
    { months: 4, downPayment: 40, description: '40% down, 20% over 3 months' }
  ];

  constructor(
    private fb: FormBuilder,
    private settingsService: SystemSettingsService,
    // REMOVED: private toastr: ToastrService
  ) {
    this.settingsForm = this.fb.group({
      platformName: ['Tabital Pay'],
      defaultCurrency: ['GHS'],
      timezone: ['Africa/Accra'],
      dateFormat: ['DD/MM/YYYY'],
      timeFormat: ['24h'],
      language: ['en'],
      maintenanceMode: [false],
      
      // Fee Settings
      merchantFeePercentage: [10],
      lateFeePercentage: [10],
      serviceFee: [0],
      lateFeeGracePeriodDays: [3],
      
      // API Settings
      apiRateLimit: [1000],
      apiRateLimitWindow: [60],
      
      // Security Settings
      sessionTimeout: [30],
      maxLoginAttempts: [5],
      twoFactorRequired: [false],
      
      // Notification Settings
      emailNotifications: [true],
      smsNotifications: [false],
      
      // Payout Settings
      minimumPayoutAmount: [100],
      payoutSchedule: ['daily'],
      autoPayoutEnabled: [true]
    });
    
    this.installmentOptionsForm = this.fb.group({
      options: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadSettings();
    this.loadInstallmentOptions();
    this.setupAutoSave();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  get installmentOptionsArray(): FormArray {
    return this.installmentOptionsForm.get('options') as FormArray;
  }
  
  loadSettings(): void {
    this.isLoading = true;
    this.settingsService.getSettings().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (settings) => {
        this.settingsForm.patchValue(settings);
        this.isLoading = false;
        alert('✅ Settings loaded successfully');
      },
      error: (error) => {
        console.error('Error loading settings:', error);
        alert('❌ Failed to load system settings');
        this.isLoading = false;
      }
    });
  }
  
  loadInstallmentOptions(): void {
    this.settingsService.getInstallmentOptions().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.setInstallmentOptions(response.installment_options);
        alert('✅ Installment options loaded successfully');
      },
      error: (error) => {
        console.error('Error loading installment options:', error);
        // Load default options
        this.setInstallmentOptions([
          { months: 1, downPayment: 100, interestRate: 0, enabled: true },
          { months: 2, downPayment: 50, interestRate: 0, enabled: true },
          { months: 3, downPayment: 50, interestRate: 0, enabled: true },
          { months: 4, downPayment: 40, interestRate: 0, enabled: true }
        ]);
        alert('⚠️ Using default installment options');
      }
    });
  }
  
  setInstallmentOptions(options: any[]): void {
    const formArray = this.installmentOptionsArray;
    formArray.clear();
    options.forEach(option => {
      formArray.push(this.createInstallmentOptionGroup(option));
    });
  }
  
  createInstallmentOptionGroup(option: any): FormGroup {
    return this.fb.group({
      months: [option.months],
      downPayment: [option.downPayment],
      interestRate: [option.interestRate || 0],
      enabled: [option.enabled !== false]
    });
  }
  
  addInstallmentOption(): void {
    this.installmentOptionsArray.push(this.createInstallmentOptionGroup({
      months: 6,
      downPayment: 30,
      interestRate: 5,
      enabled: true
    }));
    alert('➕ New installment plan added');
  }
  
  removeInstallmentOption(index: number): void {
    const confirmed = confirm(`Are you sure you want to remove this installment plan?`);
    if (confirmed) {
      this.installmentOptionsArray.removeAt(index);
      alert('🗑️ Installment plan removed');
    }
  }
  
  setupAutoSave(): void {
    this.settingsForm.valueChanges.pipe(
      debounceTime(3000),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // Auto-save is optional, we'll use manual save
    });
  }
  
  saveSettings(): void {
    this.isLoading = true;
    const settings = this.settingsForm.value;
    
    this.settingsService.updateSettings(settings).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        alert('✅ Settings saved successfully');
        this.isLoading = false;
        this.addToRecentChanges('System settings updated');
      },
      error: (error) => {
        console.error('Error saving settings:', error);
        alert('❌ Failed to save settings');
        this.isLoading = false;
      }
    });
  }
  
  saveInstallmentOptions(): void {
    this.isLoading = true;
    const options = this.installmentOptionsArray.value;
    
    this.settingsService.updateInstallmentOptions({ installment_options: options }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        alert('✅ Installment options saved successfully');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error saving installment options:', error);
        alert('❌ Failed to save installment options');
        this.isLoading = false;
      }
    });
  }
  
  addToRecentChanges(action: string): void {
    this.recentChanges.unshift({
      action: action,
      user: 'Current Admin',
      date: new Date().toLocaleString()
    });
    // Keep only last 10 changes
    if (this.recentChanges.length > 10) {
      this.recentChanges.pop();
    }
  }
  
  resetSettings(): void {
    const confirmed = confirm('⚠️ Are you sure you want to reset all settings to default values?');
    if (confirmed) {
      const defaultSettings = {
        platformName: 'Tabital Pay',
        defaultCurrency: 'GHS',
        timezone: 'Africa/Accra',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        language: 'en',
        maintenanceMode: false,
        merchantFeePercentage: 10,
        lateFeePercentage: 10,
        serviceFee: 0,
        lateFeeGracePeriodDays: 3,
        apiRateLimit: 1000,
        apiRateLimitWindow: 60,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        twoFactorRequired: false,
        emailNotifications: true,
        smsNotifications: false,
        minimumPayoutAmount: 100,
        payoutSchedule: 'daily',
        autoPayoutEnabled: true
      };
      this.settingsForm.reset(defaultSettings);
      alert('ℹ️ Settings reset to defaults. Click save to apply.');
    }
  }
  
  testApiConnection(): void {
    alert('🔌 Testing API connection...');
    this.settingsService.testConnection().subscribe({
      next: () => {
        alert('✅ API connection successful');
      },
      error: () => {
        alert('❌ API connection failed');
      }
    });
  }
  
  triggerBackup(): void {
    alert('💾 Starting manual backup...');
    this.settingsService.manualBackup().subscribe({
      next: () => {
        alert('✅ Backup completed successfully');
        this.stats.lastBackup = new Date().toLocaleString();
      },
      error: () => {
        alert('❌ Backup failed');
      }
    });
  }
  
  exportSettings(): void {
    this.settingsService.exportSettings().subscribe({
      next: (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-settings-${new Date().toISOString()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        alert('✅ Settings exported successfully');
      },
      error: () => {
        alert('❌ Failed to export settings');
      }
    });
  }

  // Apply preset method (add this if needed)
  applyPreset(preset: any): void {
    const confirmed = confirm(`Apply ${preset.months} month plan with ${preset.downPayment}% down payment?`);
    if (confirmed) {
      // Find or create the preset option
      const existingIndex = this.installmentOptionsArray.value.findIndex((opt: any) => opt.months === preset.months);
      
      if (existingIndex >= 0) {
        const optionGroup = this.installmentOptionsArray.at(existingIndex);
        optionGroup.patchValue({
          downPayment: preset.downPayment,
          enabled: true
        });
        alert(`✅ ${preset.months}-month plan updated`);
      } else {
        this.installmentOptionsArray.push(this.createInstallmentOptionGroup({
          months: preset.months,
          downPayment: preset.downPayment,
          interestRate: 0,
          enabled: true
        }));
        alert(`✅ ${preset.months}-month plan added`);
      }
    }
  }
}