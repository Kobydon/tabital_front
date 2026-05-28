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
  
  // Verification Status
  verificationSteps = [
    { step: 1, name: 'Upload Documents', icon: '📄', completed: false },
    { step: 2, name: 'Under Review', icon: '🔍', completed: false },
    { step: 3, name: 'Verification Complete', icon: '✅', completed: false }
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
  // VALIDATION METHODS
  // ============================================

  private isValidFile(file: File): boolean {
    if (!file.type.match(/image\/(jpeg|png|jpg|webp)|application\/pdf/)) {
      alert('Please upload a valid file (JPEG, PNG, WEBP, or PDF)');
      return false;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return false;
    }
    
    return true;
  }

  // ============================================
  // GHANA CARD HANDLING
  // ============================================

  onFrontImageSelected(event: Event): void {
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
        this.salaryCertificatePreview = 'assets/pdf-icon.png';
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
        this.bankStatementPreview = 'assets/pdf-icon.png';
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
      
      this.uploadOptionalDocument(file, 'passport_photo', 'Passport Photo');
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
        this.proofOfAddressPreview = 'assets/pdf-icon.png';
      }
      
      this.uploadOptionalDocument(file, 'proof_of_address', 'Proof of Address');
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

  uploadOptionalDocument(file: File, documentType: string, documentName: string): void {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('document_type', documentType);
    formData.append('document_name', documentName);
    
    this.customerService.uploadOptionalDocument(formData).subscribe({
      next: (response) => {
        console.log(`${documentName} uploaded successfully`);
        this.loadDocuments();
      },
      error: (error) => {
        console.error(`Error uploading ${documentName}:`, error);
      }
    });
  }

  uploadDocuments(): void {
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
    // Ghana Card
    formData.append('front_image', this.frontImageFile);
    formData.append('back_image', this.backImageFile);
    // Additional documents
    formData.append('salary_certificate', this.salaryCertificateFile);
    formData.append('bank_statement', this.bankStatementFile);
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
    // Ghana Card
    this.frontImageFile = null;
    this.backImageFile = null;
    this.frontImagePreview = null;
    this.backImagePreview = null;
    // Salary Certificate
    this.salaryCertificateFile = null;
    this.salaryCertificatePreview = null;
    // Bank Statement
    this.bankStatementFile = null;
    this.bankStatementPreview = null;
    // Optional Documents
    this.passportPhotoFile = null;
    this.passportPhotoPreview = null;
    this.proofOfAddressFile = null;
    this.proofOfAddressPreview = null;
    // Form
    this.documentForm.reset({
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
    return !!this.frontImageFile && 
           !!this.backImageFile && 
           !!this.salaryCertificateFile && 
           !!this.bankStatementFile;
  }
}