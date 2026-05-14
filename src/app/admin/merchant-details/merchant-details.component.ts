import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService, Merchant, Transaction } from '../admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface Document {
  id: number;
  document_id: string;
  merchant_id: number;
  document_type: string;
  document_name: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  status: string;
  uploaded_by: number;
  verified_by: number;
  verified_at: string;
  rejection_reason: string;
  expiry_date: string;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-merchant-details',
  templateUrl: './merchant-details.component.html',
  styleUrls: ['./merchant-details.component.scss']
})
export class MerchantDetailsComponent implements OnInit {
  merchantId: number = 0;
  merchant: Merchant | null = null;
  isLoading: boolean = true;
  isLoadingDocuments: boolean = false;
  activeTab: string = 'overview';
  
  // Statistics
  performanceStats = {
    totalSales: 0,
    totalTransactions: 0,
    approvalRate: 0,
    refundRate: 1.2,
    chargebackRate: 0.3,
    averageOrderValue: 0
  };
  
  settlementStats = {
    commissionRate: 2.5,
    pendingPayout: 0,
    nextSettlement: '',
    lastSettlement: '20 May 2024',
    totalSettled: 0
  };
  
  recentTransactions: Transaction[] = [];
  documents: Document[] = [];
  
  // Forms
  commissionForm: FormGroup;
  settlementForm: FormGroup;
  messageForm: FormGroup;
  kycForm: FormGroup;
  uploadForm: FormGroup;
  verifyForm: FormGroup;
  
  // Modal states
  showCommissionModal: boolean = false;
  showSettlementModal: boolean = false;
  showMessageModal: boolean = false;
  showKycModal: boolean = false;
  showUploadModal: boolean = false;
  showVerifyModal: boolean = false;
  selectedDocument: Document | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.commissionForm = this.fb.group({
      commissionRate: ['', [Validators.required, Validators.min(0), Validators.max(100)]]
    });
    
    this.settlementForm = this.fb.group({
      pendingPayout: ['', [Validators.required, Validators.min(0)]],
      nextSettlement: ['', Validators.required],
      bankName: [''],
      accountName: [''],
      accountNumber: ['']
    });
    
    this.messageForm = this.fb.group({
      subject: ['', Validators.required],
      message: ['', Validators.required],
      sendEmail: [true],
      sendSms: [false]
    });
    
    this.kycForm = this.fb.group({
      kycStatus: ['verified'],
      verificationLevel: ['standard'],
      amlScreening: ['passed']
    });
    
    this.uploadForm = this.fb.group({
      document_type: ['', Validators.required],
      document_name: ['', Validators.required],
      file_name: [''],
      file_size: [0],
      mime_type: ['']
    });
    
    this.verifyForm = this.fb.group({
      status: ['verified', Validators.required],
      rejection_reason: ['']
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.merchantId = idParam ? Number(idParam) : 0;
    if (this.merchantId) {
      this.loadMerchantDetails();
      this.loadRecentTransactions();
      this.loadMerchantDocuments();
    }
  }

  loadMerchantDetails(): void {
    this.isLoading = true;
    this.adminService.getMerchant(this.merchantId).subscribe({
      next: (data: Merchant) => {
        this.merchant = data;
        this.updateStatsFromMerchant(data);
        this.updateSettlementFromMerchant(data);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading merchant:', error);
        this.isLoading = false;
        this.showErrorMessage('Failed to load merchant details. Please try again.');
      }
    });
  }

  loadRecentTransactions(): void {
    this.adminService.getTransactions({ merchantId: this.merchantId, limit: 5 }).subscribe({
      next: (data: Transaction[]) => {
        this.recentTransactions = data || [];
        this.updatePerformanceStatsFromTransactions(this.recentTransactions);
      },
      error: (error: any) => {
        console.error('Error loading transactions:', error);
        this.recentTransactions = [];
      }
    });
  }

  loadMerchantDocuments(): void {
    this.isLoadingDocuments = true;
    this.adminService.getMerchantDocuments(this.merchantId).subscribe({
      next: (data: Document[]) => {
        this.documents = data || [];
        this.isLoadingDocuments = false;
      },
      error: (error: any) => {
        console.error('Error loading documents:', error);
        this.documents = [];
        this.isLoadingDocuments = false;
      }
    });
  }

  updateStatsFromMerchant(merchant: Merchant): void {
    if (merchant?.total_sales) {
      this.performanceStats.totalSales = merchant.total_sales;
    }
    if (merchant?.total_products) {
      this.performanceStats.totalTransactions = merchant.total_products;
    }
    if (merchant?.commission_rate) {
      this.settlementStats.commissionRate = merchant.commission_rate;
      this.commissionForm.patchValue({ commissionRate: merchant.commission_rate });
    }
    if (merchant?.pending_payout) {
      this.settlementStats.pendingPayout = merchant.pending_payout;
    }
    if (merchant?.next_settlement) {
      this.settlementStats.nextSettlement = merchant.next_settlement;
    }
  }

  updatePerformanceStatsFromTransactions(transactions: Transaction[]): void {
    if (transactions && transactions.length > 0) {
      const totalSales = transactions.reduce((sum, t) => sum + (t?.amount || 0), 0);
      this.performanceStats.totalSales = totalSales;
      this.performanceStats.totalTransactions = transactions.length;
      this.performanceStats.averageOrderValue = totalSales / transactions.length;
      
      const completed = transactions.filter(t => t?.status === 'completed').length;
      this.performanceStats.approvalRate = (completed / transactions.length) * 100;
    }
  }

  updateSettlementFromMerchant(merchant: Merchant): void {
    if (merchant) {
      this.settlementForm.patchValue({
        pendingPayout: merchant.pending_payout || 0,
        nextSettlement: merchant.next_settlement || '',
        bankName: merchant.bank_name || '',
        accountName: merchant.account_name || '',
        accountNumber: merchant.account_number || ''
      });
      
      this.kycForm.patchValue({
        kycStatus: merchant.kyc_status || 'pending',
        verificationLevel: merchant.verification_level || 'standard',
        amlScreening: merchant.aml_screening || 'pending'
      });
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount || 0);
  }

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  formatBusinessType(businessType: string | null | undefined): string {
    if (!businessType) return 'Not specified';
    const types: Record<string, string> = {
      'retail': 'Retail',
      'wholesale': 'Wholesale',
      'manufacturer': 'Manufacturer',
      'distributor': 'Distributor',
      'service': 'Service Provider',
      'ecommerce': 'E-commerce',
      'restaurant': 'Restaurant'
    };
    return types[businessType] || businessType;
  }

  getStatusClass(status: string | null | undefined): string {
    const s = status?.toLowerCase() || '';
    switch(s) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      case 'approved': return 'status-approved';
      case 'disputed': return 'status-disputed';
      case 'verified': return 'status-verified';
      case 'rejected': return 'status-rejected';
      case 'uploaded': return 'status-uploaded';
      default: return 'status-default';
    }
  }

  getDocumentStatusText(status: string | null | undefined): string {
    const s = status || '';
    switch(s) {
      case 'uploaded': return '📄 Uploaded';
      case 'verified': return '✅ Verified';
      case 'rejected': return '❌ Rejected';
      case 'pending': return '⏳ Pending';
      default: return s || 'Unknown';
    }
  }

  getDocumentIcon(documentType: string | null | undefined): string {
    const type = documentType || '';
    const icons: Record<string, string> = {
      'business_registration': '📄',
      'trade_license': '📜',
      'bank_proof': '🏦',
      'tax_certificate': '📊'
    };
    return icons[type] || '📄';
  }

  getDocumentDisplayName(documentType: string | null | undefined): string {
    const type = documentType || '';
    const names: Record<string, string> = {
      'business_registration': 'Business Registration',
      'trade_license': 'Trade License',
      'bank_proof': 'Bank Proof',
      'tax_certificate': 'Tax Certificate'
    };
    return names[type] || type;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadForm.patchValue({
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type
      });
    }
  }

  updateCommission(): void {
    if (this.commissionForm.valid && this.merchant) {
      const data = { commission_rate: this.commissionForm.value.commissionRate };
      this.adminService.updateMerchantCommission(this.merchantId, data).subscribe({
        next: () => {
          this.settlementStats.commissionRate = this.commissionForm.value.commissionRate;
          this.showCommissionModal = false;
          this.showSuccessMessage('Commission updated successfully');
          this.commissionForm.reset();
        },
        error: (error: any) => {
          console.error('Error updating commission:', error);
          this.showErrorMessage('Failed to update commission');
        }
      });
    }
  }

  updateSettlementInfo(): void {
    if (this.settlementForm.valid && this.merchant) {
      const data = {
        pending_payout: this.settlementForm.value.pendingPayout,
        next_settlement: this.settlementForm.value.nextSettlement,
        bank_name: this.settlementForm.value.bankName,
        account_name: this.settlementForm.value.accountName,
        account_number: this.settlementForm.value.accountNumber
      };
      this.adminService.updateMerchantSettlement(this.merchantId, data).subscribe({
        next: () => {
          this.settlementStats.pendingPayout = this.settlementForm.value.pendingPayout;
          this.settlementStats.nextSettlement = this.settlementForm.value.nextSettlement;
          this.showSettlementModal = false;
          this.showSuccessMessage('Settlement info updated successfully');
          this.settlementForm.reset();
        },
        error: (error: any) => {
          console.error('Error updating settlement info:', error);
          this.showErrorMessage('Failed to update settlement info');
        }
      });
    }
  }

  sendMessage(): void {
    if (this.messageForm.valid) {
      const data = {
        subject: this.messageForm.value.subject,
        message: this.messageForm.value.message,
        send_email: this.messageForm.value.sendEmail,
        send_sms: this.messageForm.value.sendSms,
        merchant_id: this.merchantId
      };
      console.log('Sending message:', data);
      this.showMessageModal = false;
      this.showSuccessMessage('Message sent successfully');
      this.messageForm.reset();
    }
  }

  updateKyc(): void {
    if (this.kycForm.valid && this.merchant) {
      const data = {
        kyc_status: this.kycForm.value.kycStatus,
        verification_level: this.kycForm.value.verificationLevel,
        aml_screening: this.kycForm.value.amlScreening
      };
      this.adminService.updateMerchantKYC(this.merchantId, data).subscribe({
        next: () => {
          if (this.merchant) {
            this.merchant.kyc_status = data.kyc_status;
            this.merchant.verification_level = data.verification_level;
            this.merchant.aml_screening = data.aml_screening;
          }
          this.showKycModal = false;
          this.showSuccessMessage('KYC information updated successfully');
        },
        error: (error: any) => {
          console.error('Error updating KYC:', error);
          this.showErrorMessage('Failed to update KYC information');
        }
      });
    }
  }

  uploadDocument(): void {
    if (this.uploadForm.valid) {
      const data = {
        document_type: this.uploadForm.value.document_type,
        document_name: this.uploadForm.value.document_name,
        file_name: this.uploadForm.value.file_name,
        file_size: this.uploadForm.value.file_size,
        mime_type: this.uploadForm.value.mime_type
      };
      this.adminService.uploadDocument(this.merchantId, data).subscribe({
        next: () => {
          this.loadMerchantDocuments();
          this.showUploadModal = false;
          this.showSuccessMessage('Document uploaded successfully');
          this.uploadForm.reset();
        },
        error: (error: any) => {
          console.error('Error uploading document:', error);
          this.showErrorMessage('Failed to upload document');
        }
      });
    }
  }

  verifyDocument(doc: Document): void {
    this.selectedDocument = doc;
    this.verifyForm.patchValue({
      status: 'verified',
      rejection_reason: ''
    });
    this.showVerifyModal = true;
  }

  confirmVerifyDocument(): void {
    if (this.verifyForm.valid && this.selectedDocument) {
      const data = {
        status: this.verifyForm.value.status,
        rejection_reason: this.verifyForm.value.rejection_reason || ''
      };
      this.adminService.verifyDocument(this.selectedDocument.id, data).subscribe({
        next: () => {
          this.loadMerchantDocuments();
          this.showVerifyModal = false;
          this.showSuccessMessage('Document verified successfully');
          this.selectedDocument = null;
          this.verifyForm.reset();
        },
        error: (error: any) => {
          console.error('Error verifying document:', error);
          this.showErrorMessage('Failed to verify document');
        }
      });
    }
  }

  deleteDocument(doc: Document): void {
    if (confirm(`Are you sure you want to delete "${doc.document_name}"?`)) {
      this.adminService.deleteDocument(doc.id).subscribe({
        next: () => {
          this.loadMerchantDocuments();
          this.showSuccessMessage('Document deleted successfully');
        },
        error: (error: any) => {
          console.error('Error deleting document:', error);
          this.showErrorMessage('Failed to delete document');
        }
      });
    }
  }

  viewDocument(doc: Document): void {
    if (doc.file_path) {
      window.open(doc.file_path, '_blank');
    } else {
      this.showInfoMessage('Document file not available');
    }
  }

  disableMerchant(): void {
    if (confirm('Are you sure you want to disable this merchant?')) {
      this.adminService.updateMerchant(this.merchantId, { status: 'inactive' }).subscribe({
        next: () => {
          if (this.merchant) {
            this.merchant.status = 'inactive';
          }
          this.showSuccessMessage('Merchant disabled successfully');
        },
        error: (error: any) => {
          console.error('Error disabling merchant:', error);
          this.showErrorMessage('Failed to disable merchant');
        }
      });
    }
  }

  goToTransactions(): void {
    this.router.navigate(['/admin/transactions'], { queryParams: { merchantId: this.merchantId } });
  }

  closeModals(): void {
    this.showCommissionModal = false;
    this.showSettlementModal = false;
    this.showMessageModal = false;
    this.showKycModal = false;
    this.showUploadModal = false;
    this.showVerifyModal = false;
    this.selectedDocument = null;
    this.uploadForm.reset();
    this.verifyForm.reset();
  }

  showSuccessMessage(message: string): void {
    alert(message);
  }

  showErrorMessage(message: string): void {
    alert(message);
  }

  showInfoMessage(message: string): void {
    alert(message);
  }
}