
// src/app/customer/components/settings/settings.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CustomerService } from 'src/app/customers.service';

export interface NotificationSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  transaction_alerts: boolean;
  settlement_alerts: boolean;
  dispute_alerts: boolean;
  promotional_emails: boolean;
  newsletter: boolean;
  daily_summary: boolean;
  weekly_report: boolean;
}

export interface Preferences {
  language: string;
  timezone: string;
  currency: string;
  date_format: string;
  dashboard_layout: string;
  items_per_page: number;
}

@Component({
  selector: 'app-customer-settings',
  templateUrl: './customer-setings.component.html',
  styleUrls: ['./customer-setings.component.scss']
})
export class CustomerSettingsComponent implements OnInit {
  // Data
  notificationSettings: NotificationSettings | null = null;
  preferences: Preferences | null = null;
  
  // UI State
  isLoading = true;
  isSavingNotifications = false;
  isSavingPreferences = false;
  activeTab: 'notifications' | 'preferences' | 'billing' | 'api' = 'notifications';
  
  // Forms
  notificationForm: FormGroup;
  preferencesForm: FormGroup;
  
  // Success/Error Messages
  successMessage = '';
  errorMessage = '';
  
  // Options
  languageOptions = [
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'fr', label: 'French', flag: '🇫🇷' },
    { value: 'es', label: 'Spanish', flag: '🇪🇸' },
    { value: 'ar', label: 'Arabic', flag: '🇦🇪' }
  ];
  
  timezoneOptions = [
    { value: 'Africa/Accra', label: 'Accra (GMT+0)', offset: 'GMT+0' },
    { value: 'Africa/Lagos', label: 'Lagos (GMT+1)', offset: 'GMT+1' },
    { value: 'Africa/Nairobi', label: 'Nairobi (GMT+3)', offset: 'GMT+3' },
    { value: 'Europe/London', label: 'London (GMT+1)', offset: 'GMT+1' },
    { value: 'America/New_York', label: 'New York (GMT-4)', offset: 'GMT-4' }
  ];
  
  currencyOptions = [
    { value: 'GHS', label: 'Ghana Cedi (GHS)', symbol: '₵' },
    { value: 'USD', label: 'US Dollar (USD)', symbol: '$' },
    { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
    { value: 'GBP', label: 'British Pound (GBP)', symbol: '£' }
  ];
  
  dateFormatOptions = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '31/12/2024' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '12/31/2024' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2024-12-31' }
  ];
  
  itemsPerPageOptions = [10, 20, 30, 50, 100];

  constructor(
    private customerService: CustomerService,
    private fb: FormBuilder
  ) {
    this.notificationForm = this.fb.group({
      email_notifications: [true],
      sms_notifications: [true],
      push_notifications: [true],
      transaction_alerts: [true],
      settlement_alerts: [true],
      dispute_alerts: [true],
      promotional_emails: [false],
      newsletter: [false],
      daily_summary: [true],
      weekly_report: [true]
    });
    
    this.preferencesForm = this.fb.group({
      language: ['en'],
      timezone: ['Africa/Accra'],
      currency: ['GHS'],
      date_format: ['DD/MM/YYYY'],
      dashboard_layout: ['default'],
      items_per_page: [20]
    });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadSettings(): void {
    this.isLoading = true;
    
    // Load notification settings
    this.customerService.getCustomerNotificationSettings().subscribe({
      next: (response: any) => {
        this.notificationSettings = response;
        this.notificationForm.patchValue(response);
      },
      error: (error) => {
        console.error('Error loading notification settings:', error);
      }
    });
    
    // Load preferences
    this.customerService.getCustomerPreferences().subscribe({
      next: (response: any) => {
        this.preferences = response;
        this.preferencesForm.patchValue(response);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading preferences:', error);
        this.isLoading = false;
      }
    });
  }

  // ============================================
  // SAVE ACTIONS
  // ============================================

  saveNotificationSettings(): void {
    this.isSavingNotifications = true;
    this.clearMessages();
    
    this.customerService.updateNotificationSettings(this.notificationForm.value).subscribe({
      next: (response) => {
        this.successMessage = 'Notification settings saved successfully!';
        this.isSavingNotifications = false;
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        console.error('Error saving notification settings:', error);
        this.errorMessage = 'Failed to save notification settings. Please try again.';
        this.isSavingNotifications = false;
        setTimeout(() => this.clearMessages(), 3000);
      }
    });
  }

  savePreferences(): void {
    this.isSavingPreferences = true;
    this.clearMessages();
    
    this.customerService.updateCustomerPreferences(this.preferencesForm.value).subscribe({
      next: (response) => {
        this.successMessage = 'Preferences saved successfully!';
        this.isSavingPreferences = false;
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        console.error('Error saving preferences:', error);
        this.errorMessage = 'Failed to save preferences. Please try again.';
        this.isSavingPreferences = false;
        setTimeout(() => this.clearMessages(), 3000);
      }
    });
  }

  // ============================================
  // UI HELPERS
  // ============================================

  switchTab(tab: 'notifications' | 'preferences' | 'billing' | 'api'): void {
    this.activeTab = tab;
    this.clearMessages();
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  resetToDefault(): void {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      const defaultSettings = {
        email_notifications: true,
        sms_notifications: true,
        push_notifications: true,
        transaction_alerts: true,
        settlement_alerts: true,
        dispute_alerts: true,
        promotional_emails: false,
        newsletter: false,
        daily_summary: true,
        weekly_report: true
      };
      
      this.notificationForm.patchValue(defaultSettings);
      this.saveNotificationSettings();
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.successMessage = 'Copied to clipboard!';
      setTimeout(() => this.clearMessages(), 2000);
    });
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
}