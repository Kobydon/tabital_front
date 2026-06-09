import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Settlement {
  id: number;
  transaction_id: string;
  merchant_id: number;
  merchant_name: string;
  merchant_phone: string;
  merchant_email: string;
  product_name: string;
  amount: number;
  commission: number;
  payout_amount: number;
  payment_status: string;
  transaction_date: string;
  completion_date: string;
  days_to_settle: number | null;
  payment_method: string;
  payment_reference: string;
}

@Component({
  selector: 'app-settlements',
  templateUrl: './settlements.component.html',
  styleUrls: ['./settlements.component.scss']
})
export class SettlementsComponent implements OnInit {
  // Data
  settlements: Settlement[] = [];
  selectedSettlement: any = null;
  settlementStats: any = {};
  selectedSettlementIds: number[] = [];
  
  // UI State
  isLoading = true;
  showSettlementModal = false;
  showProcessModal = false;
  isSubmitting = false;
  
  // Filters
  searchTerm = '';
  selectedStatus = '';
  selectedMerchantId = '';
  selectedDateFrom = '';
  selectedDateTo = '';
  sortBy = 'completion_date';
  sortOrder = 'desc';
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 1;
  
  // Forms
  processForm: FormGroup;
  bulkProcessForm: FormGroup;
  
  // Math for template
  Math = Math;
  
  // Select All checkbox
  selectAll = false;
  
  // Stats Cards
  statsCards = [
    { label: 'Total Pending Payouts', value: 0, icon: '⏳', color: 'orange', isCurrency: true, growth: 0 },
    { label: 'Total Processed (30 Days)', value: 0, icon: '✅', color: 'green', isCurrency: true, growth: 0 },
    { label: 'Upcoming Settlements', value: 0, icon: '📅', color: 'blue', isCurrency: true, growth: 0 },
    { label: 'Total Settled', value: 0, icon: '💰', color: 'purple', isCurrency: true, growth: 0 },
    { label: 'Avg. Settlement Time', value: 0, icon: '⏱️', color: 'teal', isCurrency: false, suffix: ' days', growth: 0 }
  ];

  // Status Options
  statusOptions = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'settled', label: 'Settled' }
  ];

  // Payment Method Options
  paymentMethodOptions = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'cash', label: 'Cash' },
    { value: 'cheque', label: 'Cheque' }
  ];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.processForm = this.fb.group({
      payment_method: ['bank_transfer', Validators.required],
      payment_reference: [''],
      notes: ['']
    });
    
    this.bulkProcessForm = this.fb.group({
      payment_method: ['bank_transfer', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadSettlementStats();
    this.loadSettlements();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadSettlementStats(): void {
    this.adminService.getSettlementStats().subscribe({
      next: (response: any) => {
        console.log('Settlement stats:', response);
        this.settlementStats = response;
        this.updateStatsCards();
      },
      error: (error) => {
        console.error('Error loading settlement stats:', error);
      }
    });
  }

  updateStatsCards(): void {
    this.statsCards[0].value = this.settlementStats.total_pending || 0;
    this.statsCards[1].value = this.settlementStats.total_processed || 0;
    this.statsCards[2].value = this.settlementStats.upcoming_settlements || 0;
    this.statsCards[3].value = this.settlementStats.total_settled || 0;
    this.statsCards[4].value = this.settlementStats.avg_settlement_time || 0;
    this.statsCards[4].growth = this.settlementStats.settlement_time_change || 0;
  }

  loadSettlements(): void {
    this.isLoading = true;
    
    const filters: any = {
      page: this.currentPage,
      per_page: this.pageSize,
      search: this.searchTerm,
      status: this.selectedStatus,
      merchant_id: this.selectedMerchantId,
      date_from: this.selectedDateFrom,
      date_to: this.selectedDateTo,
      sort_by: this.sortBy,
      sort_order: this.sortOrder
    };
    
    this.adminService.getAllSettlements(filters).subscribe({
      next: (response: any) => {
        console.log('Settlements response:', response);
        if (Array.isArray(response)) {
          this.settlements = response;
          this.totalItems = response.length;
          this.totalPages = 1;
        } else {
          this.settlements = response.settlements || [];
          this.totalItems = response.total || 0;
          this.totalPages = response.total_pages || 1;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading settlements:', error);
        this.isLoading = false;
      }
    });
  }

  // ============================================
  // SELECTION HANDLERS
  // ============================================

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.selectedSettlementIds = this.settlements
        .filter(s => s.payment_status === 'completed')
        .map(s => s.id);
    } else {
      this.selectedSettlementIds = [];
    }
  }

  toggleSelection(settlementId: number): void {
    const index = this.selectedSettlementIds.indexOf(settlementId);
    if (index === -1) {
      this.selectedSettlementIds.push(settlementId);
    } else {
      this.selectedSettlementIds.splice(index, 1);
    }
    this.selectAll = this.selectedSettlementIds.length === this.settlements.filter(s => s.payment_status === 'completed').length;
  }

  // ============================================
  // SETTLEMENT DETAILS
  // ============================================

  viewSettlementDetails(settlement: Settlement): void {
    this.adminService.getSettlementDetail(settlement.id).subscribe({
      next: (response: any) => {
        this.selectedSettlement = response;
        this.showSettlementModal = true;
      },
      error: (error) => {
        console.error('Error loading settlement details:', error);
        alert('Failed to load settlement details');
      }
    });
  }

  // ============================================
  // SETTLEMENT ACTIONS
  // ============================================

  openProcessModal(settlement?: Settlement): void {
    if (settlement) {
      this.selectedSettlement = { settlement };
      this.processForm.patchValue({ 
        payment_method: 'bank_transfer',
        payment_reference: '',
        notes: ''
      });
    } else {
      this.bulkProcessForm.patchValue({ 
        payment_method: 'bank_transfer',
        notes: ''
      });
    }
    this.showProcessModal = true;
  }

  processSingleSettlement(): void {
    if (this.processForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.processForm.value;
    
    this.adminService.processSingleSettlement(this.selectedSettlement.settlement.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Settlement processed successfully');
        this.showProcessModal = false;
        this.loadSettlements();
        this.loadSettlementStats();
        this.selectedSettlementIds = [];
        this.selectAll = false;
      },
      error: (error) => {
        console.error('Error processing settlement:', error);
        this.isSubmitting = false;
        alert('Failed to process settlement');
      }
    });
  }

  processBulkSettlements(): void {
    if (this.selectedSettlementIds.length === 0) {
      alert('Please select at least one settlement to process');
      return;
    }
    
    if (this.bulkProcessForm.invalid) return;
    
    this.isSubmitting = true;
    const data = {
      settlement_ids: this.selectedSettlementIds,
      ...this.bulkProcessForm.value
    };
    
    this.adminService.processBulkSettlements(data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert(`Processed ${response.processed.length} settlements successfully`);
        this.showProcessModal = false;
        this.loadSettlements();
        this.loadSettlementStats();
        this.selectedSettlementIds = [];
        this.selectAll = false;
      },
      error: (error) => {
        console.error('Error processing bulk settlements:', error);
        this.isSubmitting = false;
        alert('Failed to process settlements');
      }
    });
  }

  exportSettlements(): void {
    const filters: any = {
      status: this.selectedStatus,
      date_from: this.selectedDateFrom,
      date_to: this.selectedDateTo
    };
    
    this.adminService.exportSettlements(filters).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `settlements_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        alert('Settlements exported successfully!');
      },
      error: (error) => {
        console.error('Error exporting settlements:', error);
        alert('Failed to export settlements');
      }
    });
  }

  // ============================================
  // FILTERS & SORTING
  // ============================================

  applyFilters(): void {
    this.currentPage = 1;
    this.loadSettlements();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedMerchantId = '';
    this.selectedDateFrom = '';
    this.selectedDateTo = '';
    this.sortBy = 'completion_date';
    this.sortOrder = 'desc';
    this.currentPage = 1;
    this.loadSettlements();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'desc';
    }
    this.loadSettlements();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadSettlements();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  getStatusClass(status: string): string {
    switch(status) {
      case 'pending': return 'status-pending';
      case 'completed': return 'status-completed';
      case 'settled': return 'status-settled';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'pending': return '⏳';
      case 'completed': return '🔄';
      case 'settled': return '✅';
      default: return '📄';
    }
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'pending': return 'Pending Settlement';
      case 'completed': return 'Ready for Settlement';
      case 'settled': return 'Settled';
      default: return status;
    }
  }

  formatCurrency(amount: number): string {
    if (!amount && amount !== 0) return 'GHS 0.00';
    return new Intl.NumberFormat('en-GH', { 
      style: 'currency', 
      currency: 'GHS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatNumber(num: number): string {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
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

  closeModals(): void {
    this.showSettlementModal = false;
    this.showProcessModal = false;
    this.selectedSettlement = null;
    this.isSubmitting = false;
  }
}