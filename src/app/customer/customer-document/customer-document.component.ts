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
  
  // Ghana Card Images
  frontImagePreview: string | null = null;
  backImagePreview: string | null = null;
  frontImageFile: File | null = null;
  backImageFile: File | null = null;
  
  // Salary Certificate
  salaryCertificatePreview: string | null = null;
  salaryCertificateFile: File | null = null;
  
  // Bank Statement (3 months)
  bankStatementPreview: string | null = null;
  bankStatementFile: File | null = null;
  
  // Optional Documents
  passportPhotoPreview: string | null = null;
  passportPhotoFile: File | null = null;
  proofOfAddressPreview: string | null = null;
  proofOfAddressFile: File | null = null;
  
  // Upload Restriction State
  canUploadDocuments = true;
  uploadBlockReason: string | null = null;
  hasPendingDocuments = false;
  hasVerifiedDocuments = false;
  hasRejectedDocuments = false;
  
  // Verification Status
  verificationSteps = [
    { step: 1, name: 'Upload Documents', icon: '📄', completed: false },
    { step: 2, name: 'Under Review', icon: '🔍', completed: false },
    { step: 3, name: 'Verification Complete', icon: '✅', completed: false }
  ];

  // File Validation Settings
  readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  readonly ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
  readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png', 
    'image/jpg',
    'image/webp',
    'application/pdf'
  ];

  constructor(
    private customerService: CustomerService,
    private fb: FormBuilder
  ) {
    this.documentForm = this.fb.group({
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadDocuments();
    this.loadKYCStatus();
  }

  // ============================================
  // CHECK UPLOAD PERMISSIONS BASED ON DOCUMENT STATUS
  // ============================================

  checkUploadPermissions(): void {
    this.hasPendingDocuments = false;
    this.hasVerifiedDocuments = false;
    this.hasRejectedDocuments = false;
    
    for (const doc of this.documents) {
      if (doc.status === 'pending') {
        this.hasPendingDocuments = true;
      }
      if (doc.status === 'verified') {
        this.hasVerifiedDocuments = true;
      }
      if (doc.status === 'rejected') {
        this.hasRejectedDocuments = true;
      }
    }
    
    // If ANY document is pending → CANNOT upload
    if (this.hasPendingDocuments) {
      this.canUploadDocuments = false;
      this.uploadBlockReason = 'You have documents currently under review. Please wait for the review to complete before uploading new documents.';
      return;
    }
    
    // If documents are verified → CANNOT upload
    if (this.hasVerifiedDocuments && this.documents.length >= 4) {
      this.canUploadDocuments = false;
      this.uploadBlockReason = 'Your documents have been verified. No further uploads are required.';
      return;
    }
    
    // If documents were rejected → CAN upload new documents
    if (this.hasRejectedDocuments) {
      this.canUploadDocuments = true;
      this.uploadBlockReason = null;
      return;
    }
    
    // No documents uploaded yet → CAN upload
    if (this.documents.length === 0) {
      this.canUploadDocuments = true;
      this.uploadBlockReason = null;
      return;
    }
    
    this.canUploadDocuments = true;
    this.uploadBlockReason = null;
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
        this.checkUploadPermissions();
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
      } else if (this.kycStatus.status === 'pending' && this.hasPendingDocuments) {
        this.verificationSteps[0].completed = true;
        this.verificationSteps[1].completed = true;
        this.verificationSteps[2].completed = false;
      } else if (this.hasRejectedDocuments) {
        this.verificationSteps[0].completed = false;
        this.verificationSteps[1].completed = false;
        this.verificationSteps[2].completed = false;
      } else {
        this.verificationSteps[0].completed = false;
        this.verificationSteps[1].completed = false;
        this.verificationSteps[2].completed = false;
      }
    }
  }

  // ============================================
  // FILE VALIDATION METHODS
  // ============================================

  private isValidFile(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!extension || !this.ALLOWED_EXTENSIONS.includes(extension)) {
      alert(`Invalid file type. Please upload ${this.ALLOWED_EXTENSIONS.join(', ')} files only.`);
      return false;
    }
    
    if (file.size === 0) {
      alert('File is empty. Please select a valid file.');
      return false;
    }
    
    if (file.size > this.MAX_FILE_SIZE) {
      alert(`File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit. Please compress your file.`);
      return false;
    }
    
    return true;
  }

  // ============================================
  // GHANA CARD HANDLING
  // ============================================

  onFrontImageSelected(event: Event): void {
    if (!this.canUploadDocuments) {
      alert(this.uploadBlockReason);
      return;
    }
    
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!this.isValidFile(file)) return;
      
      this.frontImageFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.frontImagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onBackImageSelected(event: Event): void {
    if (!this.canUploadDocuments) {
      alert(this.uploadBlockReason);
      return;
    }
    
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!this.isValidFile(file)) return;
      
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
  // SALARY CERTIFICATE HANDLING
  // ============================================

  onSalaryCertificateSelected(event: Event): void {
    if (!this.canUploadDocuments) {
      alert(this.uploadBlockReason);
      return;
    }
    
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!this.isValidFile(file)) return;
      
      this.salaryCertificateFile = file;
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.salaryCertificatePreview = reader.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.salaryCertificatePreview = 'pdf';
      }
    }
  }

  removeSalaryCertificate(): void {
    this.salaryCertificateFile = null;
    this.salaryCertificatePreview = null;
  }

  // ============================================
  // BANK STATEMENT HANDLING
  // ============================================

  onBankStatementSelected(event: Event): void {
    if (!this.canUploadDocuments) {
      alert(this.uploadBlockReason);
      return;
    }
    
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!this.isValidFile(file)) return;
      
      this.bankStatementFile = file;
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.bankStatementPreview = reader.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.bankStatementPreview = 'pdf';
      }
    }
  }

  removeBankStatement(): void {
    this.bankStatementFile = null;
    this.bankStatementPreview = null;
  }

  // ============================================
  // OPTIONAL DOCUMENTS HANDLING
  // ============================================

  onPassportSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!this.isValidFile(file)) return;
      
      this.passportPhotoFile = file;
      
      const reader = new FileReader();
      reader.onload = () => {
        this.passportPhotoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onAddressSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!this.isValidFile(file)) return;
      
      this.proofOfAddressFile = file;
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.proofOfAddressPreview = reader.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.proofOfAddressPreview = 'pdf';
      }
    }
  }

  removePassportPhoto(): void {
    this.passportPhotoFile = null;
    this.passportPhotoPreview = null;
  }

  removeProofOfAddress(): void {
    this.proofOfAddressFile = null;
    this.proofOfAddressPreview = null;
  }

  // ============================================
  // UPLOAD METHODS
  // ============================================

  uploadDocuments(): void {
    if (!this.canUploadDocuments) {
      alert(this.uploadBlockReason);
      return;
    }
    
    // Check required documents
    if (!this.frontImageFile || !this.backImageFile) {
      alert('Please upload both front and back images of your Ghana Card');
      return;
    }
    
    if (!this.salaryCertificateFile) {
      alert('Please upload your Salary Certificate');
      return;
    }
    
    if (!this.bankStatementFile) {
      alert('Please upload your 3 months Bank Statement');
      return;
    }
    
    this.isUploading = true;
    
    const formData = new FormData();
    formData.append('front_image', this.frontImageFile);
    formData.append('back_image', this.backImageFile);
    formData.append('salary_certificate', this.salaryCertificateFile);
    formData.append('bank_statement', this.bankStatementFile);
    formData.append('notes', this.documentForm.value.notes || '');
    
    this.customerService.uploadKycDocuments(formData).subscribe({
      next: (response) => {
        this.isUploading = false;
        alert('✅ Documents uploaded successfully! Your verification is pending.');
        this.resetForm();
        this.loadDocuments();
        this.loadKYCStatus();
      },
      error: (error) => {
        console.error('Error uploading documents:', error);
        this.isUploading = false;
        alert('❌ Failed to upload documents. Please try again.');
      }
    });
  }

  resetForm(): void {
    this.frontImageFile = null;
    this.backImageFile = null;
    this.frontImagePreview = null;
    this.backImagePreview = null;
    this.salaryCertificateFile = null;
    this.salaryCertificatePreview = null;
    this.bankStatementFile = null;
    this.bankStatementPreview = null;
    this.passportPhotoFile = null;
    this.passportPhotoPreview = null;
    this.proofOfAddressFile = null;
    this.proofOfAddressPreview = null;
    this.documentForm.reset({ notes: '' });
  }

  isPdfPreview(preview: string | null): boolean {
    return preview === 'pdf';
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
      case 'rejected': return 'Verification Failed - Please Re-upload';
      default: return 'Not Started';
    }
  }

  isFormComplete(): boolean {
    return !!this.frontImageFile && 
           !!this.backImageFile && 
           !!this.salaryCertificateFile && 
           !!this.bankStatementFile;
  }
  
}