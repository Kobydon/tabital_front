import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MerchantService } from 'src/app/merchant.service';

@Component({
  selector: 'app-merchant-settings',
  templateUrl: './merchant-settings.component.html',
  styleUrls: ['./merchant-settings.component.scss']
})
export class MerchantSettingsComponent implements OnInit {
  activeTab = 'profile';
  isLoading = false;
  isSavingNotifications = false;
  
  // Profile Form
  profileForm: FormGroup;
  
  // Password Form
  passwordForm: FormGroup;
  
  // Payment Settings Form
  paymentForm: FormGroup;
  
  // Notification Settings
  notificationSettings = {
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
  
  // Preferences
  preferences: any = {};
  
  // KYC Form
  kycForm: FormGroup;
  
  // Activity Log
  activityLog: any[] = [];
  
  // Business Types
  businessTypes = [
    'retail', 'wholesale', 'manufacturer', 'distributor', 
    'service', 'ecommerce', 'restaurant', 'other'
  ];
  
  // Verification Levels
  verificationLevels = ['basic', 'standard', 'enhanced'];
  
  // Timezones
  timezones = [
    'Africa/Accra', 'Africa/Lagos', 'Africa/Nairobi', 
    'UTC', 'America/New_York', 'Europe/London'
  ];
  
  // Date Formats
  dateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

  constructor(
    private merchantService: MerchantService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      business_name: ['', Validators.required],
      owner_name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
      business_email: ['', [Validators.email]],
      business_phone: [''],
      website: [''],
      business_type: [''],
      registration_number: [''],
      tax_id: [''],
      city: [''],
      address: [''],
      business_address: [''],
      description: ['']
    });
    
    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
    
    this.paymentForm = this.fb.group({
      payment_method: [''],
      bank_name: [''],
      account_name: [''],
      account_number: [''],
      momo_name: [''],
      momo_number: ['']
    });
    
    this.kycForm = this.fb.group({
      kyc_status: [''],
      verification_level: ['']
    });
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadNotificationSettings();
    this.loadPreferences();
    this.loadActivityLog();
  }

  // Custom validator for password matching
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('new_password');
    const confirmPassword = control.get('confirm_password');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { mismatch: true };
    }
    return null;
  }

  // Helper method to check if passwords mismatch
  hasPasswordMismatch(): boolean {
    return this.passwordForm.errors?.['mismatch'] && this.passwordForm.get('confirm_password')?.touched;
  }

  loadProfile() {
    this.isLoading = true;
    this.merchantService.getProfile().subscribe({
      next: (data) => {
        this.profileForm.patchValue(data);
        this.paymentForm.patchValue({
          payment_method: data.payment_method,
          bank_name: data.bank_name,
          account_name: data.account_name,
          account_number: data.account_number,
          momo_name: data.momo_name,
          momo_number: data.momo_number
        });
        this.kycForm.patchValue({
          kyc_status: data.kyc_status,
          verification_level: data.verification_level
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.isLoading = false;
      }
    });
  }

  updateProfile() {
    if (this.profileForm.valid) {
      this.isLoading = true;
      this.merchantService.updateProfile(this.profileForm.value).subscribe({
        next: () => {
          alert('Profile updated successfully');
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          alert('Failed to update profile');
          this.isLoading = false;
        }
      });
    }
  }

  updatePassword() {
    if (this.passwordForm.valid) {
      this.isLoading = true;
      const data = {
        current_password: this.passwordForm.value.current_password,
        new_password: this.passwordForm.value.new_password
      };
      this.merchantService.updatePassword(data).subscribe({
        next: () => {
          alert('Password updated successfully');
          this.passwordForm.reset();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating password:', error);
          alert(error.error?.error || 'Failed to update password');
          this.isLoading = false;
        }
      });
    }
  }

  updatePaymentSettings() {
    if (this.paymentForm.valid) {
      this.isLoading = true;
      this.merchantService.updatePaymentSettings(this.paymentForm.value).subscribe({
        next: () => {
          alert('Payment settings updated successfully');
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating payment settings:', error);
          alert('Failed to update payment settings');
          this.isLoading = false;
        }
      });
    }
  }

  loadNotificationSettings() {
    this.merchantService.getNotificationSettings().subscribe({
      next: (data) => {
        this.notificationSettings = {
          email_notifications: data.email_notifications ?? true,
          sms_notifications: data.sms_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
          transaction_alerts: data.transaction_alerts ?? true,
          settlement_alerts: data.settlement_alerts ?? true,
          dispute_alerts: data.dispute_alerts ?? true,
          promotional_emails: data.promotional_emails ?? false,
          newsletter: data.newsletter ?? false,
          daily_summary: data.daily_summary ?? true,
          weekly_report: data.weekly_report ?? true
        };
      },
      error: (error) => {
        console.error('Error loading notification settings:', error);
        // Keep default values if error
      }
    });
  }

  updateNotificationSettings() {
    this.isSavingNotifications = true;
    this.merchantService.updateNotificationSettings(this.notificationSettings).subscribe({
      next: () => {
        alert('Notification settings updated successfully');
        this.isSavingNotifications = false;
      },
      error: (error) => {
        console.error('Error updating notification settings:', error);
        alert('Failed to update notification settings');
        this.isSavingNotifications = false;
      }
    });
  }

  loadPreferences() {
    this.merchantService.getPreferences().subscribe({
      next: (data) => {
        this.preferences = data;
      },
      error: (error) => {
        console.error('Error loading preferences:', error);
      }
    });
  }

  updatePreferences() {
    this.isLoading = true;
    this.merchantService.updatePreferences(this.preferences).subscribe({
      next: () => {
        alert('Preferences updated successfully');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating preferences:', error);
        alert('Failed to update preferences');
        this.isLoading = false;
      }
    });
  }

  updateKYC() {
    this.isLoading = true;
    this.merchantService.updateKYC(this.kycForm.value).subscribe({
      next: () => {
        alert('KYC information updated successfully');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating KYC:', error);
        alert('Failed to update KYC information');
        this.isLoading = false;
      }
    });
  }

  loadActivityLog() {
    this.merchantService.getActivityLog().subscribe({
      next: (data) => {
        this.activityLog = data.activities || [];
      },
      error: (error) => {
        console.error('Error loading activity log:', error);
      }
    });
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onTabChange(tab: string) {
    this.activeTab = tab;
    if (tab === 'activity') {
      this.loadActivityLog();
    }
  }
}