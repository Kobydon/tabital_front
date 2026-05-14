import { Component, OnInit } from '@angular/core';
// import { MerchantService } from '../services/merchant.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MerchantService } from 'src/app/merchant.service';

interface Dispute {
  id: number;
  dispute_id: string;
  transaction_id: number;
  transaction_ref: string;
  customer_name: string;
  customer_phone: string;
  reason: string;
  description: string;
  amount: number;
  status: string;
  resolution: string;
  created_at: string;
  updated_at: string;
}

interface DisputeDetails extends Dispute {
  transaction_amount: number;
  transaction_date: string;
  customer_email: string;
  resolution_notes: string;
  refund_amount: number;
  merchant_notes: string;
  customer_notes: string;
  admin_notes: string;
  evidence_notes: string;
  resolved_at: string;
}

@Component({
  selector: 'app-merchant-disputes',
  templateUrl: './merchant-disputes.component.html',
  styleUrls: ['./merchant-disputes.component.scss']
})
export class MerchantDisputesComponent implements OnInit {
  isLoading = false;
  disputes: Dispute[] = [];
  selectedDispute: DisputeDetails | null = null;
  
  // Filters
  searchTerm = '';
  selectedStatus = 'all';
  selectedReason = 'all';
  startDate = '';
  endDate = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  
  // Stats
  stats = {
    total_disputes: 0,
    open_disputes: 0,
    under_review: 0,
    resolved: 0,
    closed: 0,
    reason_breakdown: {} as any,
    total_amount: 0,
    refunded_amount: 0,
    merchant_won: 0,
    customer_won: 0,
    win_rate: 0
  };
  
  // Modal states
  showDetailsModal = false;
  showResponseModal = false;
  showAcceptModal = false;
  showRejectModal = false;
  showEscalateModal = false;
  
  // Forms
  responseForm: FormGroup;
  acceptForm: FormGroup;
  rejectForm: FormGroup;
  escalateForm: FormGroup;
  
  // Options
  statusOptions = [
    { value: 'all', label: 'All Status', icon: '📊' },
    { value: 'open', label: 'Open', icon: '🟢' },
    { value: 'under_review', label: 'Under Review', icon: '🔄' },
    { value: 'resolved', label: 'Resolved', icon: '✅' },
    { value: 'closed', label: 'Closed', icon: '🔒' },
    { value: 'escalated', label: 'Escalated', icon: '⚠️' }
  ];
  
  reasonOptions = [
    { value: 'all', label: 'All Reasons', icon: '📋' },
    { value: 'product_not_received', label: 'Product Not Received', icon: '📦' },
    { value: 'defective', label: 'Defective Product', icon: '🔧' },
    { value: 'not_as_described', label: 'Not as Described', icon: '📝' },
    { value: 'unauthorized', label: 'Unauthorized Transaction', icon: '🔒' },
    { value: 'other', label: 'Other', icon: '❓' }
  ];

  constructor(
    private merchantService: MerchantService,
    private fb: FormBuilder
  ) {
    this.responseForm = this.fb.group({
      merchant_notes: ['', Validators.required]
    });
    
    this.acceptForm = this.fb.group({
      refund_amount: ['', [Validators.required, Validators.min(0.01)]],
      notes: ['']
    });
    
    this.rejectForm = this.fb.group({
      reason: ['', Validators.required]
    });
    
    this.escalateForm = this.fb.group({
      notes: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadDisputes();
    this.loadStats();
  }

  loadDisputes() {
    this.isLoading = true;
    const filters: any = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    
    if (this.selectedStatus !== 'all') filters.status = this.selectedStatus;
    if (this.selectedReason !== 'all') filters.reason = this.selectedReason;
    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.startDate) filters.start_date = this.startDate;
    if (this.endDate) filters.end_date = this.endDate;
    
    this.merchantService.getMerchantDisputes(filters).subscribe({
      next: (response: any) => {
        this.disputes = response.disputes || [];
        this.totalItems = response.total || 0;
        this.totalPages = response.total_pages || 0;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading disputes:', error);
        this.isLoading = false;
      }
    });
  }

  loadStats() {
    this.merchantService.getDisputeStats().subscribe({
      next: (data: any) => {
        this.stats = data;
      },
      error: (error: any) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadDisputes();
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.selectedReason = 'all';
    this.startDate = '';
    this.endDate = '';
    this.currentPage = 1;
    this.loadDisputes();
  }

  changePage(page: number) {
    this.currentPage = page;
    this.loadDisputes();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  viewDisputeDetails(dispute: Dispute) {
    this.merchantService.getDisputeDetails(dispute.id).subscribe({
      next: (data: DisputeDetails) => {
        this.selectedDispute = data;
        this.showDetailsModal = true;
      },
      error: (error: any) => {
        console.error('Error loading dispute details:', error);
        alert('Failed to load dispute details');
      }
    });
  }

  openResponseModal(dispute: Dispute) {
    this.selectedDispute = dispute as DisputeDetails;
    this.responseForm.reset();
    this.showResponseModal = true;
  }

  submitResponse() {
    if (this.responseForm.valid && this.selectedDispute) {
      this.merchantService.updateDispute(this.selectedDispute.id, this.responseForm.value).subscribe({
        next: () => {
          this.loadDisputes();
          this.loadStats();
          this.showResponseModal = false;
          alert('Response submitted successfully');
        },
        error: (error: any) => {
          console.error('Error submitting response:', error);
          alert('Failed to submit response');
        }
      });
    }
  }

  openAcceptModal(dispute: Dispute) {
    this.selectedDispute = dispute as DisputeDetails;
    this.acceptForm.patchValue({
      refund_amount: dispute.amount,
      notes: ''
    });
    this.showAcceptModal = true;
  }

  acceptDispute() {
    if (this.acceptForm.valid && this.selectedDispute) {
      this.merchantService.acceptDispute(this.selectedDispute.id, this.acceptForm.value).subscribe({
        next: () => {
          this.loadDisputes();
          this.loadStats();
          this.showAcceptModal = false;
          alert('Dispute accepted and refund processed');
        },
        error: (error: any) => {
          console.error('Error accepting dispute:', error);
          alert('Failed to accept dispute');
        }
      });
    }
  }

  openRejectModal(dispute: Dispute) {
    this.selectedDispute = dispute as DisputeDetails;
    this.rejectForm.reset();
    this.showRejectModal = true;
  }

  rejectDispute() {
    if (this.rejectForm.valid && this.selectedDispute) {
      this.merchantService.rejectDispute(this.selectedDispute.id, this.rejectForm.value).subscribe({
        next: () => {
          this.loadDisputes();
          this.loadStats();
          this.showRejectModal = false;
          alert('Dispute rejected');
        },
        error: (error: any) => {
          console.error('Error rejecting dispute:', error);
          alert('Failed to reject dispute');
        }
      });
    }
  }

  openEscalateModal(dispute: Dispute) {
    this.selectedDispute = dispute as DisputeDetails;
    this.escalateForm.reset();
    this.showEscalateModal = true;
  }

  escalateDispute() {
    if (this.escalateForm.valid && this.selectedDispute) {
      this.merchantService.escalateDispute(this.selectedDispute.id, this.escalateForm.value).subscribe({
        next: () => {
          this.loadDisputes();
          this.loadStats();
          this.showEscalateModal = false;
          alert('Dispute escalated to admin');
        },
        error: (error: any) => {
          console.error('Error escalating dispute:', error);
          alert('Failed to escalate dispute');
        }
      });
    }
  }

  getReasonLabel(reason: string): string {
    const reasons: Record<string, string> = {
      'product_not_received': 'Product Not Received',
      'defective': 'Defective Product',
      'not_as_described': 'Not as Described',
      'unauthorized': 'Unauthorized Transaction',
      'other': 'Other'
    };
    return reasons[reason] || reason;
  }

  getReasonIcon(reason: string): string {
    const icons: Record<string, string> = {
      'product_not_received': '📦',
      'defective': '🔧',
      'not_as_described': '📝',
      'unauthorized': '🔒',
      'other': '❓'
    };
    return icons[reason] || '📋';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount || 0);
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'open': return 'status-open';
      case 'under_review': return 'status-review';
      case 'resolved': return 'status-resolved';
      case 'closed': return 'status-closed';
      case 'escalated': return 'status-escalated';
      default: return 'status-default';
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'open': return '🟢';
      case 'under_review': return '🔄';
      case 'resolved': return '✅';
      case 'closed': return '🔒';
      case 'escalated': return '⚠️';
      default: return '📌';
    }
  }

  closeModals() {
    this.showDetailsModal = false;
    this.showResponseModal = false;
    this.showAcceptModal = false;
    this.showRejectModal = false;
    this.showEscalateModal = false;
    this.responseForm.reset();
    this.acceptForm.reset();
    this.rejectForm.reset();
    this.escalateForm.reset();
  }
}