import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

interface Merchant {
  id: number;
  merchant_id: string;
  business_name: string;
  owner_name: string;
  phone: string;
  business_email: string;
  business_type: string;
  kyc_status: string;
  risk_level: string;
  status: string;
  total_gmv: number;
  total_transactions: number;
  active_plans: number;
  commission_rate: number;
}

@Component({
  selector: 'app-merchant-overview',
  templateUrl: './merchant-overview.component.html',
  styleUrls: ['./merchant-overview.component.scss']
})
export class MerchantOverviewComponent implements OnInit {
  // Data
  merchants: Merchant[] = [];
  selectedMerchant: any = null;
  merchantStats: any = {};
  
  // UI State
  isLoading = true;
  showMerchantModal = false;
  showUpdateStatusModal = false;
  showUpdateCommissionModal = false;
  showAdjustReserveModal = false;
  isSubmitting = false;
  
  // Filters
  searchTerm = '';
  selectedKYCStatus = '';
  selectedRiskLevel = '';
  selectedMerchantStatus = '';
  sortBy = 'created_at';
  sortOrder = 'desc';
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 1;
  
  // Forms
  updateStatusForm: FormGroup;
  updateCommissionForm: FormGroup;
  adjustReserveForm: FormGroup;
  
  // Math for template
  Math = Math;
  
  // Stats Cards
  statsCards = [
    { label: 'Total Merchants', value: 0, icon: 'fa-store', color: 'blue', suffix: '', growth: 0, isCurrency: false },
    { label: 'Active Merchants', value: 0, icon: 'fa-check-circle', color: 'green', suffix: '', growth: 0, isCurrency: false },
    { label: 'New Merchants (30 Days)', value: 0, icon: 'fa-user-plus', color: 'purple', suffix: '', growth: 0, isCurrency: false },
    { label: 'Total GMV (30 Days)', value: 0, icon: 'fa-chart-line', color: 'orange', suffix: '', growth: 0, isCurrency: true },
    { label: 'Avg. Payout Time', value: 0, icon: 'fa-clock', color: 'teal', suffix: ' days', growth: 0, isCurrency: false },
    { label: 'On Hold / Restricted', value: 0, icon: 'fa-exclamation-triangle', color: 'red', suffix: '', growth: 0, isCurrency: false }
  ];

  // KYC Status Options
  kycStatusOptions = [
    { value: '', label: 'All' },
    { value: 'verified', label: 'Verified' },
    { value: 'pending', label: 'Pending' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // Risk Level Options
  riskLevelOptions = [
    { value: '', label: 'All' },
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' }
  ];

  // Merchant Status Options
  merchantStatusOptions = [
    { value: '', label: 'All' },
    { value: 'approved', label: 'Approved' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'restricted', label: 'Restricted' },
    { value: 'suspended', label: 'Suspended' }
  ];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,private router:Router
  ) {
    this.updateStatusForm = this.fb.group({
      status: ['', Validators.required],
      reason: ['']
    });
    
    this.updateCommissionForm = this.fb.group({
      commission_rate: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      reason: ['']
    });
    
    this.adjustReserveForm = this.fb.group({
      reserve_amount: ['', [Validators.required, Validators.min(0)]],
      reason: ['']
    });
  }

  ngOnInit(): void {
    this.loadMerchantStats();
    this.loadMerchants();
  }

  // ============================================
  // DATA LOADING
  // ============================================
// Add this method to the MerchantOverviewComponent class

formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
  loadMerchantStats(): void {
    this.adminService.getMerchantStats().subscribe({
      next: (response: any) => {
        console.log('Merchant stats:', response);
        this.merchantStats = response;
        this.updateStatsCards();
      },
      error: (error) => {
        console.error('Error loading merchant stats:', error);
      }
    });
  }

  updateStatsCards(): void {
    this.statsCards[0].value = this.merchantStats.total_merchants || 0;
    this.statsCards[0].growth = this.merchantStats.total_merchants_growth || 0;
    this.statsCards[1].value = this.merchantStats.active_merchants || 0;
    this.statsCards[1].growth = this.merchantStats.active_merchants_growth || 0;
    this.statsCards[2].value = this.merchantStats.new_merchants || 0;
    this.statsCards[2].growth = this.merchantStats.new_merchants_growth || 0;
    this.statsCards[3].value = this.merchantStats.total_gmv || 0;
    this.statsCards[3].growth = this.merchantStats.gmv_growth || 0;
    this.statsCards[4].value = this.merchantStats.avg_payout_time || 0;
    this.statsCards[4].growth = this.merchantStats.payout_time_change || 0;
    this.statsCards[5].value = this.merchantStats.restricted_merchants || 0;
    this.statsCards[5].growth = this.merchantStats.restricted_growth || 0;
  }

  loadMerchants(): void {
    this.isLoading = true;
    
    const filters: any = {
      page: this.currentPage,
      per_page: this.pageSize,
      search: this.searchTerm,
      kyc_status: this.selectedKYCStatus,
      status: this.selectedMerchantStatus,
      risk_level: this.selectedRiskLevel,
      sort_by: this.sortBy,
      sort_order: this.sortOrder
    };
    
    this.adminService.getAllMerchants(filters).subscribe({
      next: (response: any) => {
        console.log('Merchants response:', response);
        if (Array.isArray(response)) {
          this.merchants = response;
          this.totalItems = response.length;
          this.totalPages = 1;
        } else {
          this.merchants = response.merchants || [];
          this.totalItems = response.total || 0;
          this.totalPages = response.total_pages || 1;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading merchants:', error);
        this.isLoading = false;
      }
    });
  }

  // ============================================
  // MERCHANT DETAILS
  // ============================================

  viewMerchantDetails(merchant: Merchant): void {
    this.adminService.getMerchantDetail(merchant.id).subscribe({
      next: (response: any) => {
        this.selectedMerchant = response;
        this.showMerchantModal = true;
      },
      error: (error) => {
        console.error('Error loading merchant details:', error);
        alert('Failed to load merchant details');
      }
    });
  }

  // ============================================
  // MERCHANT ACTIONS
  // ============================================

  openUpdateStatusModal(merchant: Merchant): void {
    this.selectedMerchant = { merchant };
    this.updateStatusForm.patchValue({ status: merchant.status, reason: '' });
    this.showUpdateStatusModal = true;
  }

  updateMerchantStatus(): void {
    if (this.updateStatusForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.updateStatusForm.value;
    
    this.adminService.updateMerchantStatus(this.selectedMerchant.merchant.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Merchant status updated successfully');
        this.showUpdateStatusModal = false;
        this.loadMerchants();
        this.loadMerchantStats();
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.isSubmitting = false;
        alert('Failed to update status');
      }
    });
  }

  openUpdateCommissionModal(merchant: Merchant): void {
    this.selectedMerchant = { merchant };
    this.updateCommissionForm.patchValue({ 
      commission_rate: merchant.commission_rate || 10, 
      reason: '' 
    });
    this.showUpdateCommissionModal = true;
  }

  updateCommissionRate(): void {
    if (this.updateCommissionForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.updateCommissionForm.value;
    
    this.adminService.updateMerchantCommission(this.selectedMerchant.merchant.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Commission rate updated successfully');
        this.showUpdateCommissionModal = false;
        this.loadMerchants();
      },
      error: (error) => {
        console.error('Error updating commission:', error);
        this.isSubmitting = false;
        alert('Failed to update commission rate');
      }
    });
  }

  openAdjustReserveModal(merchant: Merchant): void {
    this.selectedMerchant = { merchant };
    this.adjustReserveForm.reset();
    this.showAdjustReserveModal = true;
  }

  adjustReserve(): void {
    if (this.adjustReserveForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.adjustReserveForm.value;
    
    this.adminService.adjustMerchantReserve(this.selectedMerchant.merchant.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('Reserve amount adjusted successfully');
        this.showAdjustReserveModal = false;
      },
      error: (error) => {
        console.error('Error adjusting reserve:', error);
        this.isSubmitting = false;
        alert('Failed to adjust reserve');
      }
    });
  }

  viewTransactions(merchant: Merchant): void {
    // Navigate to transactions page with merchant filter
    this.router.navigate(['/admin/transactions'], { queryParams: { merchant_id: merchant.id } });
  }

  exportMerchants(): void {
    const filters: any = {
      search: this.searchTerm,
      kyc_status: this.selectedKYCStatus,
      status: this.selectedMerchantStatus,
      risk_level: this.selectedRiskLevel,
      sort_by: this.sortBy,
      sort_order: this.sortOrder
    };
    
    this.adminService.exportMerchants(filters).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `merchants_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        alert('Merchants exported successfully!');
      },
      error: (error) => {
        console.error('Error exporting merchants:', error);
        alert('Failed to export merchants');
      }
    });
  }

  // ============================================
  // FILTERS & SORTING
  // ============================================

  applyFilters(): void {
    this.currentPage = 1;
    this.loadMerchants();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedKYCStatus = '';
    this.selectedRiskLevel = '';
    this.selectedMerchantStatus = '';
    this.sortBy = 'created_at';
    this.sortOrder = 'desc';
    this.currentPage = 1;
    this.loadMerchants();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'desc';
    }
    this.loadMerchants();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadMerchants();
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

  getRiskClass(riskLevel: string): string {
    switch(riskLevel?.toLowerCase()) {
      case 'low': return 'risk-low';
      case 'medium': return 'risk-medium';
      case 'high': return 'risk-high';
      default: return '';
    }
  }

  getKYCStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'verified': return 'kyc-verified';
      case 'pending': return 'kyc-pending';
      case 'rejected': return 'kyc-rejected';
      default: return '';
    }
  }

  getStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'approved':
      case 'active': return 'status-active';
      case 'pending': return 'status-pending';
      case 'restricted': return 'status-restricted';
      case 'suspended': return 'status-suspended';
      default: return '';
    }
  }

  getTrendClass(growth: number): string {
    if (growth > 0) return 'trend-up';
    if (growth < 0) return 'trend-down';
    return 'trend-neutral';
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

  closeModals(): void {
    this.showMerchantModal = false;
    this.showUpdateStatusModal = false;
    this.showUpdateCommissionModal = false;
    this.showAdjustReserveModal = false;
    this.selectedMerchant = null;
    this.isSubmitting = false;
  }
}