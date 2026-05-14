import { Component, OnInit } from '@angular/core';
// import { MerchantService } from '../services/merchant.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MerchantService } from 'src/app/merchant.service';

interface Settlement {
  period: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  commission: number;
  net_amount: number;
  status: string;
  transactions?: any[];
}

interface SettlementSummary {
  pending_amount: number;
  pending_commission: number;
  pending_net: number;
  pending_transactions: number;
  commission_rate: number;
  last_settlement: string;
  next_settlement_estimate: string;
  monthly_breakdown: any[];
  bank_name: string;
  account_name: string;
  account_number: string;
}

@Component({
  selector: 'app-merchant-settlements',
  templateUrl: './merchant-settlements.component.html',
  styleUrls: ['./merchant-settlements.component.scss']
})
export class MerchantSettlementsComponent implements OnInit {
  isLoading = false;
  settlements: Settlement[] = [];
  selectedSettlement: any = null;
  
  // Filters
  startDate = '';
  endDate = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  
  // Summary
  summary: SettlementSummary = {
    pending_amount: 0,
    pending_commission: 0,
    pending_net: 0,
    pending_transactions: 0,
    commission_rate: 2.5,
    last_settlement: '',
    next_settlement_estimate: '',
    monthly_breakdown: [],
    bank_name: '',
    account_name: '',
    account_number: ''
  };
  
  // Modal states
  showDetailsModal = false;
  showPayoutModal = false;
  showSettingsModal = false;
  
  // Forms
  payoutForm: FormGroup;
  settingsForm: FormGroup;
  
  // Chart data
  monthlyChartData: any[] = [];

  constructor(
    private merchantService: MerchantService,
    private fb: FormBuilder
  ) {
    this.payoutForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]]
    });
    
    this.settingsForm = this.fb.group({
      bank_name: ['', Validators.required],
      account_name: ['', Validators.required],
      account_number: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadSettlements();
    this.loadSummary();
  }

  loadSettlements() {
    this.isLoading = true;
    const filters: any = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    
    if (this.startDate) filters.start_date = this.startDate;
    if (this.endDate) filters.end_date = this.endDate;
    
    this.merchantService.getMerchantSettlements(filters).subscribe({
      next: (response: any) => {
        this.settlements = response.settlements || [];
        this.totalItems = response.total || 0;
        this.totalPages = response.total_pages || 0;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading settlements:', error);
        this.isLoading = false;
      }
    });
  }

  loadSummary() {
    this.merchantService.getSettlementSummary().subscribe({
      next: (data: SettlementSummary) => {
        this.summary = data;
        this.prepareChartData();
        this.settingsForm.patchValue({
          bank_name: data.bank_name,
          account_name: data.account_name,
          account_number: data.account_number
        });
      },
      error: (error: any) => {
        console.error('Error loading summary:', error);
      }
    });
  }

  prepareChartData() {
    if (this.summary.monthly_breakdown) {
      this.monthlyChartData = this.summary.monthly_breakdown.map(item => ({
        name: item.month,
        value: item.net,
        commission: item.commission,
        total: item.total
      }));
    }
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadSettlements();
  }

  resetFilters() {
    this.startDate = '';
    this.endDate = '';
    this.currentPage = 1;
    this.loadSettlements();
  }

  changePage(page: number) {
    this.currentPage = page;
    this.loadSettlements();
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

  viewSettlementDetails(settlement: any) {
    // For now, just show the settlement details
    this.selectedSettlement = settlement;
    this.showDetailsModal = true;
  }

  requestPayout() {
    if (this.payoutForm.valid) {
      this.merchantService.requestPayout(this.payoutForm.value.amount).subscribe({
        next: (response: any) => {
          this.showPayoutModal = false;
          this.payoutForm.reset();
          alert(`Payout request submitted successfully. Estimated date: ${response.estimated_date}`);
          this.loadSummary();
        },
        error: (error: any) => {
          console.error('Error requesting payout:', error);
          alert(error.error?.error || 'Failed to request payout');
        }
      });
    }
  }

  updateSettings() {
    if (this.settingsForm.valid) {
      this.merchantService.updateSettlementSettings(this.settingsForm.value).subscribe({
        next: () => {
          this.showSettingsModal = false;
          alert('Settlement settings updated successfully');
          this.loadSummary();
        },
        error: (error: any) => {
          console.error('Error updating settings:', error);
          alert('Failed to update settlement settings');
        }
      });
    }
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
      case 'paid': return 'status-paid';
      case 'processing': return 'status-processing';
      case 'pending': return 'status-pending';
      default: return 'status-default';
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'paid': return '✅';
      case 'processing': return '🔄';
      case 'pending': return '⏳';
      default: return '📌';
    }
  }

  closeModals() {
    this.showDetailsModal = false;
    this.showPayoutModal = false;
    this.showSettingsModal = false;
    this.payoutForm.reset();
  }
}