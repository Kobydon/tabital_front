import { Component, OnInit, HostListener } from '@angular/core';
import { AdminService } from '../admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { notify } from 'src/app/shared/notify';
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
  fee_tier?: string;
  fee_tier_label?: string;
  fee_percentage?: number;
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
  styles: [`.kyb-preview { margin: 0 0 16px; } .kyb-preview img { max-width: 100%; border-radius: 8px; }
    .kyb-preview iframe { width: 100%; height: 60vh; border: 1px solid var(--tp-line); border-radius: 8px; }`]
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

  // Merchant fee tiers (§6.1), chosen by management at approval or later with a reason
  tiers: { value: string; label: string; fee_percentage: number }[] = [];
  approvalTier = 'standard';
  approvalTierReason = '';
  tierMerchant: any = null;
  tierValue = 'standard';
  tierReason = '';
  
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
    this.adminService.getMerchantFeeTiers().subscribe({
      next: (res: any) => { this.tiers = res.tiers || []; },
      error: () => { this.tiers = []; }            // operations admins can't change tiers anyway
    });
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
        this.pendingMerchants = response.pending_verifications || [];
        this.stats.pending = this.pendingMerchants.length;
        this.stats.totalDocuments = this.pendingMerchants.reduce(
          (total, m) => total + (m.documents?.length || 0), 0
        );
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
      }
    });
  }

  loadVerifiedKYC(): void {
    this.adminService.getVerifiedKYC().subscribe({
      next: (response) => {
        this.verifiedMerchants = response.verified_merchants || [];
        this.stats.verified = this.verifiedMerchants.length;
      },
      error: (error) => console.error('Error loading verified KYC:', error)
    });
  }

  loadRejectedKYC(): void {
    this.adminService.getRejectedKYC().subscribe({
      next: (response) => {
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
    this.selectedMerchant = merchant;
    this.approvalTier = merchant.fee_tier || 'standard';
    this.approvalTierReason = '';
    this.showMerchantModal = true;
  }

  countDocs(merchant: MerchantKYC, status: string): number {
    return (merchant.documents || []).filter(d => d.status === status).length;
  }

  tierTone(tier: string | undefined): 'success' | 'info' | 'warn' {
    return tier === 'premium' ? 'success' : tier === 'high_risk' ? 'warn' : 'info';
  }

  openTierDialog(merchant: any): void {
    this.tierMerchant = merchant;
    this.tierValue = merchant.fee_tier || 'standard';
    this.tierReason = '';
  }

  saveTier(): void {
    if (!this.tierMerchant || this.tierReason.trim().length < 5) return;
    this.isProcessing = true;
    this.adminService.setMerchantFeeTier(this.tierMerchant.merchant_id, this.tierValue, this.tierReason.trim()).subscribe({
      next: (res: any) => {
        this.isProcessing = false;
        notify(res?.message || 'Fee tier saved', 'success');
        this.tierMerchant = null;
        this.loadVerifiedKYC();
      },
      error: (err: any) => { this.isProcessing = false; notify(err?.message || 'Could not save the fee tier', 'error'); }
    });
  }

  approveMerchant(): void {
    if (!this.selectedMerchant) return;
    
    this.isProcessing = true;
    const body = this.approvalTier && this.approvalTier !== (this.selectedMerchant.fee_tier || 'standard')
      ? { fee_tier: this.approvalTier, fee_tier_reason: this.approvalTierReason.trim() || undefined } : {};
    this.adminService.approveMerchantKYC(this.selectedMerchant.merchant_id, body).subscribe({
      next: (response) => {
        this.isProcessing = false;
        notify('Merchant approved', 'success');
        this.closeAllModals();
        this.loadAllData();
      },
      error: (error) => {
        this.isProcessing = false;
        notify(error?.message || 'Failed to approve merchant. Please try again.', 'error');
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
          notify('Merchant rejected', 'success');
          this.closeAllModals();
          this.loadAllData();
        },
        error: (error) => {
          this.isProcessing = false;
          notify(error?.message || 'Failed to reject merchant. Please try again.', 'error');
        }
      });
    } else if (this.rejectType === 'document' && this.selectedDocument) {
      this.adminService.rejectDocument(this.selectedDocument.id, reason).subscribe({
        next: (response) => {
          this.isProcessing = false;
          notify('Document rejected', 'success');
          this.showRejectModal = false;
          this.markDocument('rejected', reason);
        },
        error: (error) => {
          this.isProcessing = false;
          notify(error?.message || 'Failed to reject document. Please try again.', 'error');
        }
      });
    }
  }

  // ============================================
  // DOCUMENT MODAL WITH FIXED PREVIEW
  // ============================================

  viewDocument(document: Document): void {
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
      notify('No document data available for download');
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
      notify('Failed to download document. Please try again.', 'error');
    }
  }

  onPdfError(): void {
    this.pdfError = true;
    this.isPdfLoading = false;
  }

  approveDocument(): void {
    if (!this.selectedDocument) return;
    
    this.isProcessing = true;
    this.adminService.approveDocument(this.selectedDocument.id).subscribe({
      next: (response) => {
        this.isProcessing = false;
        notify('Document accepted', 'success');
        this.markDocument('verified');
      },
      error: (error) => {
        this.isProcessing = false;
        notify(error?.message || 'Failed to accept document. Please try again.', 'error');
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

  /** Back from a document to the merchant it belongs to. */
  closeDocument(): void {
    this.showDocumentModal = false;
    if (this.currentPdfUrl) {
      URL.revokeObjectURL(this.currentPdfUrl);
      this.currentPdfUrl = null;
    }
    this.pdfUrl = null;
    this.imageUrl = null;
    this.selectedDocument = null;
  }

  private markDocument(status: string, reason?: string): void {
    if (this.selectedDocument) {
      this.selectedDocument.status = status;
      if (reason) this.selectedDocument.rejection_reason = reason;
    }
    this.closeDocument();
    this.loadAllData();
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