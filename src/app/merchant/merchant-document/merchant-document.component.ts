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
  auto_rejected?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
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
  validationErrors: ValidationError[] = [];
  uploadError: string | null = null;
  
  // Upload Restriction State
  canUploadDocuments = true;
  uploadBlockReason: string | null = null;
  hasPendingDocuments = false;
  hasVerifiedDocuments = false;
  
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
  showBankDetailsForm = false;
  isSavingBankDetails = false;
  
  // Verification Steps
  verificationSteps = [
    { step: 1, name: 'Upload Documents', icon: '📄', completed: false },
    { step: 2, name: 'Under Review', icon: '🔍', completed: false },
    { step: 3, name: 'Verification Complete', icon: '✅', completed: false }
  ];
  
  // File Validation Settings
  readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  readonly ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

  constructor(
    private merchantService: MerchantService,
    private fb: FormBuilder
  ) {
    this.documentForm = this.fb.group({
      notes: ['']
    });
    
    this.bankDetailsForm = this.fb.group({
      bank_name: [''],
      account_name: [''],
      account_number: [''],
      branch_name: [''],
      swift_code: [''],
      momo_name: [''],
      momo_number: ['']
    });
  }

  ngOnInit(): void {
    this.loadDocuments();
    this.loadKYCStatus();
    this.loadBankDetails();
  }

  // ============================================
  // CHECK IF USER CAN UPLOAD DOCUMENTS
  // Based on document status, not just KYC status
  // ============================================

  checkUploadPermissions(): void {
    // Reset flags
    this.hasPendingDocuments = false;
    this.hasVerifiedDocuments = false;
    
    // Check document statuses
    for (const doc of this.documents) {
      if (doc.status === 'pending') {
        this.hasPendingDocuments = true;
      }
      if (doc.status === 'verified') {
        this.hasVerifiedDocuments = true;
      }
    }
    
    // RULE 1: If there are ANY documents with status 'pending' → CANNOT upload
    if (this.hasPendingDocuments) {
      this.canUploadDocuments = false;
      this.uploadBlockReason = 'You have documents currently under review. Please wait for the review to complete before uploading new documents.';
      return;
    }
    
    // RULE 2: If documents are verified (approved) → CANNOT upload (already verified)
    if (this.hasVerifiedDocuments && this.documents.length >= 3) {
      this.canUploadDocuments = false;
      this.uploadBlockReason = 'Your documents have been verified. No further uploads are required.';
      return;
    }
    
    // RULE 3: If documents were rejected → CAN upload new documents
    const hasRejectedDocuments = this.documents.some(doc => doc.status === 'rejected');
    if (hasRejectedDocuments) {
      this.canUploadDocuments = true;
      this.uploadBlockReason = null;
      return;
    }
    
    // RULE 4: No documents uploaded yet → CAN upload
    if (this.documents.length === 0) {
      this.canUploadDocuments = true;
      this.uploadBlockReason = null;
      return;
    }
    
    // Default: allow upload
    this.canUploadDocuments = true;
    this.uploadBlockReason = null;
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadDocuments(): void {
    this.isLoading = true;
    
    this.merchantService.getMerchantDocuments().subscribe({
      next: (response: any) => {
        console.log('Documents loaded:', response);
        this.documents = response.documents || [];
        this.updateVerificationSteps();
        this.checkUploadPermissions(); // Check permissions after loading documents
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
        console.log('KYC Status loaded:', response);
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
        console.log('Bank details loaded:', response);
        if (response && (response.bank_name || response.momo_name)) {
          this.showBankDetailsForm = true;
          this.bankDetailsForm.patchValue({
            bank_name: response.bank_name || '',
            account_name: response.account_name || '',
            account_number: response.account_number || '',
            branch_name: response.branch_name || '',
            swift_code: response.swift_code || '',
            momo_name: response.momo_name || '',
            momo_number: response.momo_number || ''
          });
        }
      },
      error: (error) => {
        console.error('Error loading bank details:', error);
      }
    });
  }

  updateVerificationSteps(): void {
    // Check if any document is pending
    const hasPending = this.documents.some(doc => doc.status === 'pending');
    const allVerified = this.documents.length >= 3 && this.documents.every(doc => doc.status === 'verified');
    const anyRejected = this.documents.some(doc => doc.status === 'rejected');
    
    if (allVerified) {
      this.verificationSteps[0].completed = true;
      this.verificationSteps[1].completed = true;
      this.verificationSteps[2].completed = true;
    } else if (hasPending) {
      this.verificationSteps[0].completed = true;
      this.verificationSteps[1].completed = true;
      this.verificationSteps[2].completed = false;
    } else if (anyRejected) {
      this.verificationSteps[0].completed = false;
      this.verificationSteps[1].completed = false;
      this.verificationSteps[2].completed = false;
    } else if (this.documents.length > 0) {
      this.verificationSteps[0].completed = true;
      this.verificationSteps[1].completed = false;
      this.verificationSteps[2].completed = false;
    } else {
      this.verificationSteps[0].completed = false;
      this.verificationSteps[1].completed = false;
      this.verificationSteps[2].completed = false;
    }
  }

  // ============================================
  // FILE VALIDATION METHODS
  // ============================================

  validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file selected.' };
    }
    
    if (file.size === 0) {
      return { valid: false, error: 'File is empty. Please select a valid file.' };
    }
    
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit.`
      };
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !this.ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `Invalid file type. Please upload ${this.ALLOWED_EXTENSIONS.join(', ')} files only.`
      };
    }

    return { valid: true };
  }

  // ============================================
  // FILE HANDLING
  // ============================================

  onFileSelected(event: Event, type: string): void {
    // Check if upload is allowed
    if (!this.canUploadDocuments) {
      alert(this.uploadBlockReason);
      return;
    }
    
    const input = event.target as HTMLInputElement;
    this.validationErrors = [];
    this.uploadError = null;
    
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      console.log(`File selected for ${type}:`, file.name, file.size, 'bytes');
      
      const validation = this.validateFile(file);
      if (!validation.valid) {
        this.validationErrors.push({ field: type, message: validation.error! });
        alert(validation.error);
        input.value = '';
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
      if (docType === 'business') {
        this.businessRegistrationPreview = 'pdf';
      } else if (docType === 'tax') {
        this.taxDocumentPreview = 'pdf';
      } else if (docType === 'bank') {
        this.bankStatementPreview = 'pdf';
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
    this.validationErrors = this.validationErrors.filter(e => e.field !== type);
    this.uploadError = null;
  }

  // ============================================
  // FORM VALIDATION
  // ============================================

  isFormComplete(): boolean {
    return !!this.businessRegistrationFile && 
           !!this.taxDocumentFile && 
           !!this.bankStatementFile;
  }

  getMissingDocuments(): string[] {
    const missing: string[] = [];
    if (!this.businessRegistrationFile) missing.push('Business Registration Certificate');
    if (!this.taxDocumentFile) missing.push('Tax Document (TIN/VAT)');
    if (!this.bankStatementFile) missing.push('Bank Account Proof');
    return missing;
  }

  // ============================================
  // DOCUMENT UPLOAD
  // ============================================

  uploadDocuments(): void {
    if (!this.canUploadDocuments) {
      alert(this.uploadBlockReason);
      return;
    }
    
    this.validationErrors = [];
    this.uploadError = null;
    
    if (!this.isFormComplete()) {
      const missing = this.getMissingDocuments();
      this.uploadError = `Missing required documents:\n• ${missing.join('\n• ')}`;
      alert(this.uploadError);
      return;
    }
    
    this.isUploading = true;
    
    const formData = new FormData();
    formData.append('business_registration', this.businessRegistrationFile!);
    formData.append('tax_document', this.taxDocumentFile!);
    formData.append('bank_statement', this.bankStatementFile!);
    
    const notes = this.documentForm.value.notes;
    if (notes && notes.trim()) {
      formData.append('notes', notes.trim());
    }
    
    console.log('========== UPLOADING DOCUMENTS ==========');
    console.log('Business Registration:', this.businessRegistrationFile!.name);
    console.log('Tax Document:', this.taxDocumentFile!.name);
    console.log('Bank Statement:', this.bankStatementFile!.name);
    
    this.merchantService.uploadMerchantDocuments(formData).subscribe({
      next: (response) => {
        console.log('Upload success:', response);
        this.isUploading = false;
        alert('✅ Documents uploaded successfully! Your verification is pending review.');
        this.resetForm();
        this.loadDocuments();
        this.loadKYCStatus();
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.isUploading = false;
        
        let errorMessage = 'Failed to upload documents.';
        if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.uploadError = errorMessage;
        alert(`❌ Upload failed: ${errorMessage}`);
      }
    });
  }

  saveBankDetails(): void {
    this.isSavingBankDetails = true;
    const bankData = this.bankDetailsForm.value;
    
    this.merchantService.updateBankDetails(bankData).subscribe({
      next: (response) => {
        this.isSavingBankDetails = false;
        alert('Bank details saved successfully!');
        this.showBankDetailsForm = true;
      },
      error: (error) => {
        console.error('Error saving bank details:', error);
        this.isSavingBankDetails = false;
        alert('Failed to save bank details. Please try again.');
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
    this.validationErrors = [];
    this.uploadError = null;
    this.documentForm.reset({ notes: '' });
  }

  // ============================================
  // UI HELPERS
  // ============================================

  switchTab(tab: 'upload' | 'history'): void {
    this.activeTab = tab;
    this.validationErrors = [];
    this.uploadError = null;
  }

  isPdfPreview(preview: string | null): boolean {
    return preview === 'pdf';
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
      case 'rejected': return 'Verification Failed - Please Re-upload';
      default: return 'Not Started';
    }
  }
  // Add these methods to your component

hasRejectedDocuments = false;

// Check if a specific document type is rejected
getDocumentStatus(documentType: string): string | null {
  const doc = this.documents.find(d => d.document_type === documentType);
  return doc ? doc.status : null;
}

// Check if a specific document type is rejected
hasRejectedDocument(documentType: string): boolean {
  const doc = this.documents.find(d => d.document_type === documentType);
  return doc?.status === 'rejected';
}

// Update checkUploadPermissions to track rejected documents
}