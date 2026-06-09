import { Component, OnInit, HostListener } from '@angular/core';
import { AdminService } from '../admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface CustomerKYC {
  customer_id: number;
  customer_name: string;
  phone: string;
  email: string;
  kyc_status: string;
  verification_level: string;
  submitted_at: string;
  verified_at?: string;
  documents: CustomerDocument[];
}

export interface CustomerDocument {
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

@Component({
   selector: 'app-appove-customer-kyc',
  templateUrl: './appove-customer-kyc.component.html',
  styleUrls: ['./appove-customer-kyc.component.scss']
})
export class ApproveCustomerKycComponent implements OnInit {
  // Data
  pendingCustomers: CustomerKYC[] = [];
  verifiedCustomers: any[] = [];
  rejectedCustomers: any[] = [];
  selectedCustomer: CustomerKYC | null = null;
  selectedDocument: CustomerDocument | null = null;
  
  // UI State
  isLoading = true;
  activeTab: 'pending' | 'verified' | 'rejected' = 'pending';
  showCustomerModal = false;
  showDocumentModal = false;
  showRejectModal = false;
  isProcessing = false;
  rejectType: 'customer' | 'document' = 'customer';
  
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
    this.adminService.getPendingCustomerKYC().subscribe({
      next: (response: any) => {
        console.log('Pending Customer KYC response:', response);
        this.pendingCustomers = response.pending_verifications || [];
        this.stats.pending = this.pendingCustomers.length;
        this.stats.totalDocuments = this.pendingCustomers.reduce(
          (total, m) => total + (m.documents?.length || 0), 0
        );
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading pending customer KYC:', error);
        this.isLoading = false;
      }
    });
  }

  loadVerifiedKYC(): void {
    this.adminService.getVerifiedCustomerKYC().subscribe({
      next: (response: any) => {
        console.log('Verified Customer KYC response:', response);
        this.verifiedCustomers = response.verified_customers || [];
        this.stats.verified = this.verifiedCustomers.length;
      },
      error: (error: any) => console.error('Error loading verified customer KYC:', error)
    });
  }

  loadRejectedKYC(): void {
    this.adminService.getRejectedCustomerKYC().subscribe({
      next: (response: any) => {
        console.log('Rejected Customer KYC response:', response);
        this.rejectedCustomers = response.rejected_customers || [];
        this.stats.rejected = this.rejectedCustomers.length;
      },
      error: (error: any) => console.error('Error loading rejected customer KYC:', error)
    });
  }

  // ============================================
  // CUSTOMER MODAL
  // ============================================

  viewCustomerDetails(customer: CustomerKYC): void {
    console.log('Viewing customer:', customer);
    this.selectedCustomer = customer;
    this.showCustomerModal = true;
  }

  approveCustomer(): void {
    if (!this.selectedCustomer) return;
    
    this.isProcessing = true;
    this.adminService.approveCustomerKYC(this.selectedCustomer.customer_id).subscribe({
      next: (response: any) => {
        this.isProcessing = false;
        alert('✅ Customer KYC approved successfully!');
        this.closeAllModals();
        this.loadAllData();
      },
      error: (error: any) => {
        console.error('Error approving customer:', error);
        this.isProcessing = false;
        alert('❌ Failed to approve customer. Please try again.');
      }
    });
  }

  openRejectModalForCustomer(customer: CustomerKYC): void {
    this.rejectType = 'customer';
    this.selectedCustomer = customer;
    this.selectedDocument = null;
    this.rejectForm.reset();
    this.showRejectModal = true;
  }

  openRejectModalForDocument(document: CustomerDocument): void {
    this.rejectType = 'document';
    this.selectedDocument = document;
    this.selectedCustomer = null;
    this.rejectForm.reset();
    this.showRejectModal = true;
  }

  confirmRejection(): void {
    if (this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }
    
    this.isProcessing = true;
    const reason = this.rejectForm.value.rejection_reason as string;
    
    if (this.rejectType === 'customer' && this.selectedCustomer) {
      this.adminService.rejectCustomerKYC(this.selectedCustomer.customer_id, reason).subscribe({
        next: (response: any) => {
          this.isProcessing = false;
          alert('❌ Customer KYC rejected.');
          this.closeAllModals();
          this.loadAllData();
        },
        error: (error: any) => {
          console.error('Error rejecting customer:', error);
          this.isProcessing = false;
          alert('❌ Failed to reject customer. Please try again.');
        }
      });
    } else if (this.rejectType === 'document' && this.selectedDocument) {
      this.adminService.rejectCustomerDocument(this.selectedDocument.id, reason).subscribe({
        next: (response: any) => {
          this.isProcessing = false;
          alert('❌ Document rejected.');
          this.closeAllModals();
          this.loadAllData();
        },
        error: (error: any) => {
          console.error('Error rejecting document:', error);
          this.isProcessing = false;
          alert('❌ Failed to reject document. Please try again.');
        }
      });
    }
  }

  // ============================================
  // DOCUMENT MODAL WITH PREVIEW
  // ============================================
// In approve-customer-kyc.component.ts

viewDocument(document: CustomerDocument): void {
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
    
    // Check if file_data exists
    if (document.file_data) {
        console.log('File data available, length:', document.file_data.length);
        // Process file data as before
        if (document.mime_type === 'application/pdf') {
            this.displayPdfPreview(document.file_data);
        } else if (document.mime_type?.startsWith('image/')) {
            this.imageUrl = `data:${document.mime_type};base64,${document.file_data}`;
            this.isPdfLoading = false;
        } else {
            this.isPdfLoading = false;
        }
    } else {
        console.error('No file data available for document:', document.id, document.file_name);
        this.isPdfLoading = false;
        // Show a message to the user
        alert(`Document file not found on server: ${document.file_name || 'Unknown file'}\n\nPlease check that the file was uploaded correctly.`);
    }
    
    this.showDocumentModal = true;
}
  displayPdfPreview(base64Data: string): void {
    try {
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
    
    const fileData = this.selectedDocument.file_data;
    const fileName = this.selectedDocument.file_name || 'document';
    const mimeType = this.selectedDocument.mime_type || 'application/octet-stream';
    
    try {
      const binaryString = atob(fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
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
    this.adminService.approveCustomerDocument(this.selectedDocument.id).subscribe({
      next: (response: any) => {
        this.isProcessing = false;
        alert('✅ Document approved successfully!');
        this.closeAllModals();
        this.loadAllData();
      },
      error: (error: any) => {
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
    this.showCustomerModal = false;
    this.showDocumentModal = false;
    this.showRejectModal = false;
    this.selectedCustomer = null;
    this.selectedDocument = null;
    this.rejectForm.reset();
    
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

  getDocumentIcon(docType: string | undefined | null): string {
    const icons: Record<string, string> = {
      'kyc_front': '🪪',
      'kyc_back': '🪪',
      'salary_certificate': '📄',
      'bank_statement': '🏦',
      'passport_photo': '📸',
      'proof_of_address': '🏠'
    };
    return icons[docType || ''] || '📄';
  }

  getDocumentTypeName(docType: string | undefined | null): string {
    const names: Record<string, string> = {
      'kyc_front': 'Ghana Card (Front)',
      'kyc_back': 'Ghana Card (Back)',
      'salary_certificate': 'Salary Certificate',
      'bank_statement': 'Bank Statement',
      'passport_photo': 'Passport Photo',
      'proof_of_address': 'Proof of Address'
    };
    return names[docType || ''] || docType || 'Unknown Document';
  }

  getStatusClass(status: string | undefined | null): string {
    switch (status) {
      case 'verified': return 'status-verified';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  }

  getStatusIcon(status: string | undefined | null): string {
    switch (status) {
      case 'verified': return '✅';
      case 'pending': return '⏳';
      case 'rejected': return '❌';
      default: return '📄';
    }
  }

  getStatusText(status: string | undefined | null): string {
    switch (status) {
      case 'verified': return 'Verified';
      case 'pending': return 'Pending Review';
      case 'rejected': return 'Rejected';
      default: return 'Not Submitted';
    }
  }

  formatDate(dateString: string | undefined | null): string {
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

  formatFileSize(bytes: number | undefined | null): string {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  isImage(mimeType: string | undefined | null): boolean {
    return mimeType?.startsWith('image/') || false;
  }

  isPdf(mimeType: string | undefined | null): boolean {
    return mimeType === 'application/pdf';
  }
}