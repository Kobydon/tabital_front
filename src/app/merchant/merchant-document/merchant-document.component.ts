// src/app/merchant/components/document/document.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MerchantService } from 'src/app/merchant.service';

export interface MerchantDocument {
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
  selector: 'app-merchant-document',
  templateUrl: './merchant-document.component.html',
  styleUrls: ['./merchant-document.component.scss']
})
export class MerchantDocumentComponent implements OnInit {
  // Data
  documents: MerchantDocument[] = [];
  kycStatus: any = null;
  
  // UI State
  isLoading = true;
  isUploading = false;
  activeTab: 'upload' | 'history' = 'upload';
  
  // Forms
  documentForm: FormGroup;
  
  // Document Uploads
  businessRegistrationFile: File | null = null;
  taxDocumentFile: File | null = null;
  bankStatementFile: File | null = null;
  
  businessRegistrationPreview: string | null = null;
  taxDocumentPreview: string | null = null;
  bankStatementPreview: string | null = null;
  
  // Bank Account Details Form
  bankDetailsForm: FormGroup;
  
  // Verification Steps
  verificationSteps = [
    { step: 1, name: 'Upload Documents', icon: '📄', completed: false },
    { step: 2, name: 'Under Review', icon: '🔍', completed: false },
    { step: 3, name: 'Verification Complete', icon: '✅', completed: false }
  ];
  
  // Document Types
  documentTypes = [
    { 
      value: 'business_registration', 
      label: 'Business Registration Certificate', 
      icon: '🏢', 
      description: 'Certificate of incorporation or business registration document',
      required: true
    },
    { 
      value: 'tax_document', 
      label: 'Tax Document (TIN/VAT)', 
      icon: '📊', 
      description: 'Tax Identification Number certificate or VAT registration',
      required: true
    },
    { 
      value: 'bank_statement', 
      label: 'Bank Account Details', 
      icon: '🏦', 
      description: 'Bank statement or account confirmation letter (last 3 months)',
      required: true
    }
  ];

  constructor(
    private merchantService: MerchantService,
    private fb: FormBuilder
  ) {
    this.documentForm = this.fb.group({
      document_type: ['business_registration', Validators.required],
      notes: ['']
    });
    
    this.bankDetailsForm = this.fb.group({
      bank_name: ['', Validators.required],
      account_name: ['', Validators.required],
      account_number: ['', Validators.required],
      branch_name: [''],
      swift_code: ['']
    });
  }

  ngOnInit(): void {
    this.loadDocuments();
    this.loadKYCStatus();
    this.loadBankDetails();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadDocuments(): void {
    this.isLoading = true;
    
    this.merchantService.getMerchantDocuments().subscribe({
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
    this.merchantService.getKycStatus().subscribe({
      next: (response: any) => {
        this.kycStatus = response;
        this.updateVerificationSteps();
      },
      error: (error) => {
        console.error('Error loading KYC status:', error);
      }
    });
  }

  loadBankDetails(): void {
    this.merchantService.getBankDetails().subscribe({
      next: (response: any) => {
        if (response) {
          this.bankDetailsForm.patchValue({
            bank_name: response.bank_name || '',
            account_name: response.account_name || '',
            account_number: response.account_number || '',
            branch_name: response.branch_name || '',
            swift_code: response.swift_code || ''
          });
        }
      },
      error: (error) => {
        console.error('Error loading bank details:', error);
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
  // FILE HANDLING
  // ============================================

  onFileSelected(event: Event, type: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.match(/image\/(jpeg|png|jpg|webp)|application\/pdf/)) {
        alert('Please upload a valid file (JPEG, PNG, WEBP, or PDF)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      if (type === 'business_registration') {
        this.businessRegistrationFile = file;
        this.createPreview(file, 'business');
      } else if (type === 'tax_document') {
        this.taxDocumentFile = file;
        this.createPreview(file, 'tax');
      } else if (type === 'bank_statement') {
        this.bankStatementFile = file;
        this.createPreview(file, 'bank');
      }
    }
  }

  createPreview(file: File, docType: string): void {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (docType === 'business') {
          this.businessRegistrationPreview = reader.result as string;
        } else if (docType === 'tax') {
          this.taxDocumentPreview = reader.result as string;
        } else if (docType === 'bank') {
          this.bankStatementPreview = reader.result as string;
        }
      };
      reader.readAsDataURL(file);
    } else {
      // For PDF, show a PDF icon
      const iconUrl = 'assets/pdf-icon.png';
      if (docType === 'business') {
        this.businessRegistrationPreview = iconUrl;
      } else if (docType === 'tax') {
        this.taxDocumentPreview = iconUrl;
      } else if (docType === 'bank') {
        this.bankStatementPreview = iconUrl;
      }
    }
  }

  removeFile(type: string): void {
    if (type === 'business_registration') {
      this.businessRegistrationFile = null;
      this.businessRegistrationPreview = null;
    } else if (type === 'tax_document') {
      this.taxDocumentFile = null;
      this.taxDocumentPreview = null;
    } else if (type === 'bank_statement') {
      this.bankStatementFile = null;
      this.bankStatementPreview = null;
    }
  }

  // ============================================
  // DOCUMENT UPLOAD
  // ============================================

  saveBankDetails(): void {
    if (this.bankDetailsForm.invalid) {
      alert('Please fill all required bank details');
      return;
    }
    
    this.merchantService.updateBankDetails(this.bankDetailsForm.value).subscribe({
      next: (response) => {
        alert('Bank details saved successfully!');
      },
      error: (error) => {
        console.error('Error saving bank details:', error);
        alert('Failed to save bank details. Please try again.');
      }
    });
  }

  uploadDocuments(): void {
    if (!this.businessRegistrationFile || !this.taxDocumentFile || !this.bankStatementFile) {
      alert('Please upload all required documents');
      return;
    }
    
    if (this.bankDetailsForm.invalid) {
      alert('Please fill in your bank account details first');
      return;
    }
    
    this.isUploading = true;
    
    const formData = new FormData();
    formData.append('business_registration', this.businessRegistrationFile);
    formData.append('tax_document', this.taxDocumentFile);
    formData.append('bank_statement', this.bankStatementFile);
    formData.append('notes', this.documentForm.value.notes || '');
    
    this.merchantService.uploadMerchantDocuments(formData).subscribe({
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
    this.businessRegistrationFile = null;
    this.taxDocumentFile = null;
    this.bankStatementFile = null;
    this.businessRegistrationPreview = null;
    this.taxDocumentPreview = null;
    this.bankStatementPreview = null;
    this.documentForm.reset({
      document_type: 'business_registration',
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

  isFormComplete(): boolean {
    return !!this.businessRegistrationFile && 
           !!this.taxDocumentFile && 
           !!this.bankStatementFile && 
           this.bankDetailsForm.valid;
  }
}