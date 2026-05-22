// src/app/customer/components/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService, CustomerProfile } from 'src/app/customers.service';

export interface KYCStatus {
  status: 'pending' | 'verified' | 'rejected' | 'not_submitted';
  level: 'basic' | 'standard' | 'verified';
  submitted_at?: string;
  verified_at?: string;
  rejection_reason?: string;
}

export interface ActivityLog {
  id: number;
  action: string;
  description: string;
  ip_address: string;
  created_at: string;
}

@Component({
  selector: 'app-customer-profile',
  templateUrl: './customer-profile.component.html',
  styleUrls: ['./customer-profile.component.scss']
})
export class CustomerProfileComponent implements OnInit {
  // Data
  customerProfile: CustomerProfile | null = null;
  kycStatus: KYCStatus = { status: 'pending', level: 'basic' };
  activityLogs: ActivityLog[] = [];
  
  // UI State
  isLoading = true;
  isUpdating = false;
  isChangingPassword = false;
  isUploadingKYC = false;
  activeTab: 'profile' | 'security' | 'kyc' | 'activity' = 'profile';
  
  // Forms
  profileForm: FormGroup;
  passwordForm: FormGroup;
  kycForm: FormGroup;
  
  // File Upload
  selectedFiles: { type: string; file: File | null }[] = [
    { type: 'national_id', file: null },
    { type: 'passport_photo', file: null },
    { type: 'proof_of_address', file: null }
  ];
  
  // Success/Error Messages
  successMessage = '';
  errorMessage = '';
  
  // Password visibility
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private customerService: CustomerService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      full_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      business_name: [''],
      city: [''],
      address: [''],
      gps: [''],
      income_range: ['']
    });
    
    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
    
    this.kycForm = this.fb.group({
      id_type: ['', Validators.required],
      id_number: ['', Validators.required],
      date_of_birth: ['', Validators.required],
      nationality: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadActivityLogs();
  }

  // ============================================
  // VALIDATORS
  // ============================================

  passwordMatchValidator(group: FormGroup): any {
    const password = group.get('new_password')?.value;
    const confirm = group.get('confirm_password')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadProfile(): void {
    this.isLoading = true;
    
    this.customerService.getProfile().subscribe({
      next: (response: any) => {
        this.customerProfile = response;
        this.populateForm(response);
        this.loadKYCStatus();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.errorMessage = 'Failed to load profile. Please try again.';
        this.isLoading = false;
        setTimeout(() => this.clearMessages(), 3000);
      }
    });
  }

  populateForm(profile: CustomerProfile): void {
    this.profileForm.patchValue({
      full_name: profile.full_name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      business_name: profile.business_name || '',
      city: profile.city || '',
      address: profile.address || '',
      gps: profile.gps || '',
      income_range: profile.income_range || ''
    });
  }

  loadKYCStatus(): void {
    this.customerService.getKycCustomerStatus().subscribe({
      next: (response: any) => {
        this.kycStatus = {
          status: response.status || 'pending',
          level: response.level || 'basic',
          submitted_at: response.submitted_at,
          verified_at: response.verified_at,
          rejection_reason: response.rejection_reason
        };
      },
      error: (error) => {
        console.error('Error loading KYC status:', error);
      }
    });
  }

  loadActivityLogs(): void {
    this.customerService.getActivityLog().subscribe({
      next: (response: any) => {
        this.activityLogs = response.activities || [];
      },
      error: (error) => {
        console.error('Error loading activity logs:', error);
        // Sample data for demo
        this.activityLogs = [
          { id: 1, action: 'Login', description: 'Successful login from Accra, Ghana', ip_address: '192.168.1.1', created_at: new Date().toISOString() },
          { id: 2, action: 'Profile Update', description: 'Updated contact information', ip_address: '192.168.1.1', created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 3, action: 'Password Change', description: 'Password changed successfully', ip_address: '192.168.1.1', created_at: new Date(Date.now() - 172800000).toISOString() }
        ];
      }
    });
  }

  // ============================================
  // PROFILE ACTIONS
  // ============================================

  updateProfile(): void {
    if (this.profileForm.invalid) return;
    
    this.isUpdating = true;
    this.clearMessages();
    
    this.customerService.updateProfile(this.profileForm.value).subscribe({
      next: (response) => {
        this.successMessage = 'Profile updated successfully!';
        this.isUpdating = false;
        this.loadProfile();
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.errorMessage = 'Failed to update profile. Please try again.';
        this.isUpdating = false;
        setTimeout(() => this.clearMessages(), 3000);
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    
    this.isChangingPassword = true;
    this.clearMessages();
    
    const passwordData = {
      current_password: this.passwordForm.value.current_password,
      new_password: this.passwordForm.value.new_password
    };
    
    this.customerService.updatePassword(passwordData).subscribe({
      next: (response) => {
        this.successMessage = 'Password changed successfully!';
        this.isChangingPassword = false;
        this.passwordForm.reset();
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        console.error('Error changing password:', error);
        this.errorMessage = error.error?.message || 'Failed to change password. Please try again.';
        this.isChangingPassword = false;
        setTimeout(() => this.clearMessages(), 3000);
      }
    });
  }

  // ============================================
  // KYC ACTIONS
  // ============================================

  onFileSelected(event: Event, type: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const fileIndex = this.selectedFiles.findIndex(f => f.type === type);
      if (fileIndex !== -1) {
        this.selectedFiles[fileIndex].file = file;
      }
    }
  }

  getFileIcon(fileType: string): string {
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    return '📎';
  }

  removeFile(type: string): void {
    const fileIndex = this.selectedFiles.findIndex(f => f.type === type);
    if (fileIndex !== -1) {
      this.selectedFiles[fileIndex].file = null;
      // Reset file input
      const input = document.getElementById(`file_${type}`) as HTMLInputElement;
      if (input) input.value = '';
    }
  }

  isFormComplete(): boolean {
    return this.selectedFiles.every(f => f.file !== null) && this.kycForm.valid;
  }

  submitKYC(): void {
    if (!this.isFormComplete()) return;
    
    this.isUploadingKYC = true;
    this.clearMessages();
    
    // Upload each document
    const uploadPromises = this.selectedFiles.map(fileObj => {
      if (fileObj.file) {
        return this.customerService.uploadCustomerKycDocument(fileObj.file, fileObj.type).toPromise();
      }
      return Promise.resolve(null);
    });
    
    Promise.all(uploadPromises).then(() => {
      this.successMessage = 'KYC documents submitted successfully! Verification in progress.';
      this.isUploadingKYC = false;
      this.loadKYCStatus();
      setTimeout(() => this.clearMessages(), 5000);
    }).catch(error => {
      console.error('Error uploading KYC:', error);
      this.errorMessage = 'Failed to upload documents. Please try again.';
      this.isUploadingKYC = false;
      setTimeout(() => this.clearMessages(), 3000);
    });
  }

  // ============================================
  // UI HELPERS
  // ============================================

  switchTab(tab: 'profile' | 'security' | 'kyc' | 'activity'): void {
    this.activeTab = tab;
    this.clearMessages();
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  getKYCStatusClass(): string {
    switch (this.kycStatus.status) {
      case 'verified': return 'status-verified';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      default: return 'status-not-submitted';
    }
  }

  getKYCStatusIcon(): string {
    switch (this.kycStatus.status) {
      case 'verified': return '✅';
      case 'pending': return '⏳';
      case 'rejected': return '❌';
      default: return '📋';
    }
  }

  getKYCStatusText(): string {
    switch (this.kycStatus.status) {
      case 'verified': return 'Verified';
      case 'pending': return 'Pending Verification';
      case 'rejected': return 'Rejected';
      default: return 'Not Submitted';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateOnly(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  }

  getIncomeRangeLabel(range: string): string {
    const ranges: Record<string, string> = {
      '0-1000': 'Below GHS 1,000',
      '1000-3000': 'GHS 1,000 - 3,000',
      '3000-5000': 'GHS 3,000 - 5,000',
      '5000-10000': 'GHS 5,000 - 10,000',
      '10000+': 'Above GHS 10,000'
    };
    return ranges[range] || range;
  }
}