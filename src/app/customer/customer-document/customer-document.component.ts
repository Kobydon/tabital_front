// src/app/customer/components/document/document.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from 'src/app/customers.service';

export interface Document {
  id: number;
  document_id: string;
  document_type: string;
  document_name: string;
  status: 'pending' | 'verified' | 'rejected';
  uploaded_at: string;
  verified_at?: string;
  rejection_reason?: string;
}

@Component({
  selector: 'app-customer-document',
  templateUrl: './customer-document.component.html',
  styleUrls: ['./customer-document.component.scss']
})
export class CustomerDocumentComponent implements OnInit {
  // Data
  documents: Document[] = [];
  kycStatus: any = null;
  
  // UI State
  isLoading = true;
  isUploading = false;
  activeTab: 'upload' | 'history' = 'upload';
  
  // Forms
  documentForm: FormGroup;
  
  // Image Preview
  frontImagePreview: string | null = null;
  backImagePreview: string | null = null;
  frontImageFile: File | null = null;
  backImageFile: File | null = null;
  
  // Verification Status
  verificationSteps = [
    { step: 1, name: 'Upload Documents', icon: '📄', completed: false },
    { step: 2, name: 'Under Review', icon: '🔍', completed: false },
    { step: 3, name: 'Verification Complete', icon: '✅', completed: false }
  ];
  
  // Document Types
  documentTypes = [
    { value: 'ghana_card_front', label: 'Ghana Card (Front)', icon: '🪪', description: 'Upload clear photo of the front side of your Ghana Card' },
    { value: 'ghana_card_back', label: 'Ghana Card (Back)', icon: '🪪', description: 'Upload clear photo of the back side of your Ghana Card' },
    { value: 'passport_photo', label: 'Passport Photo', icon: '📸', description: 'Recent passport-sized photograph' },
    { value: 'proof_of_address', label: 'Proof of Address', icon: '🏠', description: 'Utility bill or bank statement (last 3 months)' }
  ];

  constructor(
    private customerService: CustomerService,
    private fb: FormBuilder
  ) {
    this.documentForm = this.fb.group({
      document_type: ['ghana_card_front', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadDocuments();
    this.loadKYCStatus();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadDocuments(): void {
    this.isLoading = true;
    
    this.customerService.getCustomerDocuments().subscribe({
      next: (response: any) => {
        this.documents = response.documents || [];
        this.updateVerificationSteps();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        this.isLoading = false;
      }
    });
  }

  loadKYCStatus(): void {
    this.customerService.getKycStatus().subscribe({
      next: (response: any) => {
        this.kycStatus = response;
        this.updateVerificationSteps();
      },
      error: (error) => {
        console.error('Error loading KYC status:', error);
      }
    });
  }

  updateVerificationSteps(): void {
    if (this.kycStatus) {
      if (this.kycStatus.status === 'verified') {
        this.verificationSteps[0].completed = true;
        this.verificationSteps[1].completed = true;
        this.verificationSteps[2].completed = true;
      } else if (this.kycStatus.status === 'pending') {
        this.verificationSteps[0].completed = true;
        this.verificationSteps[1].completed = true;
        this.verificationSteps[2].completed = false;
      } else {
        this.verificationSteps[0].completed = false;
        this.verificationSteps[1].completed = false;
        this.verificationSteps[2].completed = false;
      }
    }
  }

  // ============================================
  // IMAGE HANDLING
  // ============================================

  onFrontImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.match(/image\/(jpeg|png|jpg|webp)/)) {
        alert('Please upload a valid image file (JPEG, PNG, or WEBP)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      this.frontImageFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.frontImagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onBackImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      if (!file.type.match(/image\/(jpeg|png|jpg|webp)/)) {
        alert('Please upload a valid image file (JPEG, PNG, or WEBP)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      this.backImageFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.backImagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeFrontImage(): void {
    this.frontImageFile = null;
    this.frontImagePreview = null;
  }

  removeBackImage(): void {
    this.backImageFile = null;
    this.backImagePreview = null;
  }

  // ============================================
  // DOCUMENT UPLOAD
  // ============================================

  uploadDocuments(): void {
    if (!this.frontImageFile || !this.backImageFile) {
      alert('Please upload both front and back images of your Ghana Card');
      return;
    }
    
    this.isUploading = true;
    
    const formData = new FormData();
    formData.append('front_image', this.frontImageFile);
    formData.append('back_image', this.backImageFile);
    formData.append('document_type', this.documentForm.value.document_type);
    formData.append('notes', this.documentForm.value.notes || '');
    
    this.customerService.uploadKycDocuments(formData).subscribe({
      next: (response) => {
        this.isUploading = false;
        alert('Documents uploaded successfully! Your verification is pending.');
        this.resetForm();
        this.loadDocuments();
        this.loadKYCStatus();
      },
      error: (error) => {
        console.error('Error uploading documents:', error);
        this.isUploading = false;
        alert('Failed to upload documents. Please try again.');
      }
    });
  }

  resetForm(): void {
    this.frontImageFile = null;
    this.backImageFile = null;
    this.frontImagePreview = null;
    this.backImagePreview = null;
    this.documentForm.reset({
      document_type: 'ghana_card_front',
      notes: ''
    });
  }

  // ============================================
  // UI HELPERS
  // ============================================

  switchTab(tab: 'upload' | 'history'): void {
    this.activeTab = tab;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'verified': return 'status-verified';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'verified': return '✅';
      case 'pending': return '⏳';
      case 'rejected': return '❌';
      default: return '📄';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'verified': return 'Verified';
      case 'pending': return 'Pending Review';
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
      day: 'numeric'
    });
  }

  getKYCStatusClass(): string {
    if (!this.kycStatus) return 'status-pending';
    switch (this.kycStatus.status) {
      case 'verified': return 'status-verified';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  }

  getKYCStatusIcon(): string {
    if (!this.kycStatus) return '⏳';
    switch (this.kycStatus.status) {
      case 'verified': return '✅';
      case 'pending': return '⏳';
      case 'rejected': return '❌';
      default: return '📋';
    }
  }

  getKYCStatusText(): string {
    if (!this.kycStatus) return 'Not Started';
    switch (this.kycStatus.status) {
      case 'verified': return 'Verification Complete';
      case 'pending': return 'Verification in Progress';
      case 'rejected': return 'Verification Failed';
      default: return 'Not Started';
    }
  }
}