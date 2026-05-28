import { Component, OnInit, HostListener } from '@angular/core';
import { AdminService } from '../admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface MerchantKYC {
  merchant_id: number;
  merchant_name: string;
  owner_name: string;
  phone: string;
  business_email: string;
  city: string;
  address: string;
  kyc_status: string;
  verification_level: string;
  submitted_at: string;
  documents: Document[];
  bank_details: BankDetails;
  verified_at?: string;
}

export interface Document {
  id: number;
  document_id: string;
  document_name: string;
  document_type: string;
  status: string;
  uploaded_at: string;
  file_data: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  rejection_reason?: string;
  verified_at?: string;
}

export interface BankDetails {
  bank_name: string;
  account_name: string;
  account_number: string;
  branch_name: string;
  swift_code: string;
  momo_name: string;
  momo_number: string;
}

@Component({
  selector: 'app-approve-kyb-kyc',
  templateUrl: './approve-kyb-kyc.component.html',
  styleUrls: ['./approve-kyb-kyc.component.scss']
})
export class ApproveKybKycComponent implements OnInit {
  // Data
  pendingMerchants: MerchantKYC[] = [];
  verifiedMerchants: any[] = [];
  rejectedMerchants: any[] = [];
  selectedMerchant: MerchantKYC | null = null;
  selectedDocument: Document | null = null;
  
  // UI State
  isLoading = true;
  activeTab: 'pending' | 'verified' | 'rejected' = 'pending';
  showMerchantModal = false;
  showDocumentModal = false;
  showRejectModal = false;
  isProcessing = false;
  rejectType: 'merchant' | 'document' = 'merchant';
  
  // PDF Preview
  pdfUrl: SafeResourceUrl | null = null;
  imageUrl: string | null = null;
  currentPdfUrl: string | null = null;
  isPdfLoading = false;
  pdfError = false;
  
  // Forms
  rejectForm: FormGroup;
  
  // Statistics
  stats = {
    pending: 0,
    verified: 0,
    rejected: 0,
    totalDocuments: 0
  };

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer
  ) {
    this.rejectForm = this.fb.group({
      rejection_reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  @HostListener('window:keydown.escape', ['$event'])
  onEscapePressed(event: any): void {
    this.closeAllModals();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadAllData(): void {
    this.isLoading = true;
    this.loadPendingKYC();
    this.loadVerifiedKYC();
    this.loadRejectedKYC();
  }

  loadPendingKYC(): void {
    this.adminService.getPendingKYC().subscribe({
      next: (response) => {
        console.log('Pending KYC response:', response);
        this.pendingMerchants = response.pending_verifications || [];
        this.stats.pending = this.pendingMerchants.length;
        this.stats.totalDocuments = this.pendingMerchants.reduce(
          (total, m) => total + (m.documents?.length || 0), 0
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading pending KYC:', error);
        this.isLoading = false;
      }
    });
  }

  loadVerifiedKYC(): void {
    this.adminService.getVerifiedKYC().subscribe({
      next: (response) => {
        console.log('Verified KYC response:', response);
        this.verifiedMerchants = response.verified_merchants || [];
        this.stats.verified = this.verifiedMerchants.length;
      },
      error: (error) => console.error('Error loading verified KYC:', error)
    });
  }

  loadRejectedKYC(): void {
    this.adminService.getRejectedKYC().subscribe({
      next: (response) => {
        console.log('Rejected KYC response:', response);
        this.rejectedMerchants = response.rejected_merchants || [];
        this.stats.rejected = this.rejectedMerchants.length;
      },
      error: (error) => console.error('Error loading rejected KYC:', error)
    });
  }

  // ============================================
  // MERCHANT MODAL
  // ============================================

  viewMerchantDetails(merchant: MerchantKYC): void {
    console.log('Viewing merchant:', merchant);
    this.selectedMerchant = merchant;
    this.showMerchantModal = true;
  }

  approveMerchant(): void {
    if (!this.selectedMerchant) return;
    
    this.isProcessing = true;
    this.adminService.approveMerchantKYC(this.selectedMerchant.merchant_id).subscribe({
      next: (response) => {
        this.isProcessing = false;
        alert('✅ Merchant KYC approved successfully!');
        this.closeAllModals();
        this.loadAllData();
      },
      error: (error) => {
        console.error('Error approving merchant:', error);
        this.isProcessing = false;
        alert('❌ Failed to approve merchant. Please try again.');
      }
    });
  }

  openRejectModalForMerchant(merchant: MerchantKYC): void {
    this.rejectType = 'merchant';
    this.selectedMerchant = merchant;
    this.selectedDocument = null;
    this.rejectForm.reset();
    this.showRejectModal = true;
  }

  openRejectModalForDocument(document: Document): void {
    this.rejectType = 'document';
    this.selectedDocument = document;
    this.selectedMerchant = null;
    this.rejectForm.reset();
    this.showRejectModal = true;
  }

  confirmRejection(): void {
    if (this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }
    
    this.isProcessing = true;
    const reason = this.rejectForm.value.rejection_reason;
    
    if (this.rejectType === 'merchant' && this.selectedMerchant) {
      this.adminService.rejectMerchantKYC(this.selectedMerchant.merchant_id, reason).subscribe({
        next: (response) => {
          this.isProcessing = false;
          alert('❌ Merchant KYC rejected.');
          this.closeAllModals();
          this.loadAllData();
        },
        error: (error) => {
          console.error('Error rejecting merchant:', error);
          this.isProcessing = false;
          alert('❌ Failed to reject merchant. Please try again.');
        }
      });
    } else if (this.rejectType === 'document' && this.selectedDocument) {
      this.adminService.rejectDocument(this.selectedDocument.id, reason).subscribe({
        next: (response) => {
          this.isProcessing = false;
          alert('❌ Document rejected.');
          this.closeAllModals();
          this.loadAllData();
        },
        error: (error) => {
          console.error('Error rejecting document:', error);
          this.isProcessing = false;
          alert('❌ Failed to reject document. Please try again.');
        }
      });
    }
  }

  // ============================================
  // DOCUMENT MODAL WITH FIXED PREVIEW
  // ============================================

  viewDocument(document: Document): void {
    console.log('Viewing document:', document);
    this.selectedDocument = document;
    this.pdfError = false;
    this.isPdfLoading = true;
    
    // Clear previous previews
    if (this.currentPdfUrl) {
      URL.revokeObjectURL(this.currentPdfUrl);
      this.currentPdfUrl = null;
    }
    this.pdfUrl = null;
    this.imageUrl = null;
    
    if (document.file_data) {
      if (document.mime_type === 'application/pdf') {
        this.displayPdfPreview(document.file_data);
      } else if (document.mime_type?.startsWith('image/')) {
        this.imageUrl = `data:${document.mime_type};base64,${document.file_data}`;
        this.isPdfLoading = false;
      }
    }
    
    this.showDocumentModal = true;
  }

  displayPdfPreview(base64Data: string): void {
    try {
      // Convert base64 to blob
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      this.currentPdfUrl = url;
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.isPdfLoading = false;
      this.pdfError = false;
    } catch (error) {
      console.error('Error creating PDF preview:', error);
      this.isPdfLoading = false;
      this.pdfError = true;
      // Fallback to data URL
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `data:application/pdf;base64,${base64Data}`
      );
    }
  }

  downloadDocument(): void {
    if (!this.selectedDocument || !this.selectedDocument.file_data) {
      alert('No document data available for download');
      return;
    }
    
    const { file_data, file_name, mime_type } = this.selectedDocument;
    
    try {
      const binaryString = atob(file_data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mime_type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    }
  }

  onPdfError(): void {
    console.error('PDF failed to load');
    this.pdfError = true;
    this.isPdfLoading = false;
  }

  approveDocument(): void {
    if (!this.selectedDocument) return;
    
    this.isProcessing = true;
    this.adminService.approveDocument(this.selectedDocument.id).subscribe({
      next: (response) => {
        this.isProcessing = false;
        alert('✅ Document approved successfully!');
        this.closeAllModals();
        this.loadAllData();
      },
      error: (error) => {
        console.error('Error approving document:', error);
        this.isProcessing = false;
        alert('❌ Failed to approve document. Please try again.');
      }
    });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  switchTab(tab: 'pending' | 'verified' | 'rejected'): void {
    this.activeTab = tab;
  }

  closeAllModals(): void {
    this.showMerchantModal = false;
    this.showDocumentModal = false;
    this.showRejectModal = false;
    this.selectedMerchant = null;
    this.selectedDocument = null;
    this.rejectForm.reset();
    
    // Clean up PDF URL
    if (this.currentPdfUrl) {
      URL.revokeObjectURL(this.currentPdfUrl);
      this.currentPdfUrl = null;
    }
    this.pdfUrl = null;
    this.imageUrl = null;
    this.pdfError = false;
    this.isPdfLoading = false;
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  getDocumentIcon(docType: string): string {
    const icons: Record<string, string> = {
      'business_registration': '🏢',
      'tax_document': '📊',
      'bank_statement': '🏦'
    };
    return icons[docType] || '📄';
  }

  getDocumentTypeName(docType: string): string {
    const names: Record<string, string> = {
      'business_registration': 'Business Registration',
      'tax_document': 'Tax Document',
      'bank_statement': 'Bank Statement'
    };
    return names[docType] || docType;
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  isImage(mimeType: string): boolean {
    return mimeType?.startsWith('image/') || false;
  }

  isPdf(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }
}