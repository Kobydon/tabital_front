import { Component, OnInit, AfterViewInit } from '@angular/core';
// import { MerchantService } from '../services/merchant.service';
import { Chart } from 'chart.js';
import { Router } from '@angular/router';
import { MerchantService } from 'src/app/merchant.service';

@Component({
  selector: 'app-merchant-dashboard',
  templateUrl: './merchant-dashboard.component.html',
  styleUrls: ['./merchant-dashboard.component.scss']
})
export class MerchantDashboardComponent implements OnInit, AfterViewInit {
  isLoading = true;
  merchantName = '';
  Math = Math; // Expose Math to template for rounding
  stats = {
    totalSales: 0,
    totalTransactions: 0,
    newCustomers: 0,
    instalmentSales: 0,
    successfulRate: 0,
    salesGrowth: 0,
    transactionsGrowth: 0,
    customersGrowth: 0,
    instalmentGrowth: 0,
    successRateGrowth: 0
  };
  
  // Chart Data
  salesChartData: any[] = [];
  chart: any;
  
  // Recent Transactions
  recentTransactions: any[] = [];
  
  // Instalments Overview
  instalmentsOverview = {
    activePlans: 0,
    paid: 0,
    overdue: 0,
    completed: 0,
    totalActiveAmount: 0
  };
  
  // Settlement Info
  settlement = {
    nextSettlement: '',
    estimatedAmount: 0
  };
  
  // Account Status
  accountStatus = {
    kycVerified: false,
    payoutAccount: '',
    plan: '',
    memberSince: ''
  };

  constructor(
    private merchantService: MerchantService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadMerchantInfo();
  }

  ngAfterViewInit(): void {
    // Chart will be created after data loads
  }

  loadMerchantInfo() {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.merchantName = user.business_name || user.full_name || 'Merchant';
    }
  }

  loadDashboardData() {
    this.isLoading = true;
    
    // Load all dashboard data in parallel
    Promise.all([
      this.loadStats(),
      this.loadSalesChart(),
      this.loadRecentTransactions(),
      this.loadInstalmentsOverview(),
      this.loadSettlementInfo(),
      this.loadAccountStatus()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  loadStats(): Promise<void> {
    return new Promise((resolve) => {
      this.merchantService.getDashboardStats().subscribe({
        next: (data) => {
          this.stats = {
            totalSales: data.today_sales || 0,
            totalTransactions: data.today_transactions || 0,
            newCustomers: data.new_customers || 0,
            instalmentSales: data.instalment_sales || 0,
            successfulRate: data.success_rate || 0,
            salesGrowth: data.sales_growth || 0,
            transactionsGrowth: data.transactions_growth || 0,
            customersGrowth: data.customers_growth || 0,
            instalmentGrowth: data.instalment_growth || 0,
            successRateGrowth: data.success_rate_growth || 0
          };
          resolve();
        },
        error: (error) => {
          console.error('Error loading stats:', error);
          resolve();
        }
      });
    });
  }

  loadSalesChart(): Promise<void> {
    return new Promise((resolve) => {
      this.merchantService.getSalesChart().subscribe({
        next: (data) => {
          this.salesChartData = data;
          setTimeout(() => this.createChart(), 100);
          resolve();
        },
        error: (error) => {
          console.error('Error loading chart:', error);
          // Fallback data
          this.salesChartData = [
            { name: '14 May', value: 18500 },
            { name: '15 May', value: 19200 },
            { name: '16 May', value: 17800 },
            { name: '17 May', value: 20500 },
            { name: '18 May', value: 22800 },
            { name: '19 May', value: 24300 },
            { name: '20 May', value: 25430 }
          ];
          setTimeout(() => this.createChart(), 100);
          resolve();
        }
      });
    });
  }

  loadRecentTransactions(): Promise<void> {
    return new Promise((resolve) => {
      this.merchantService.getRecentTransactions(5).subscribe({
        next: (data) => {
          this.recentTransactions = data;
          resolve();
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
          resolve();
        }
      });
    });
  }

  loadInstalmentsOverview(): Promise<void> {
    return new Promise((resolve) => {
      this.merchantService.getInstalmentsOverview().subscribe({
        next: (data) => {
          this.instalmentsOverview = data;
          resolve();
        },
        error: (error) => {
          console.error('Error loading instalments:', error);
          resolve();
        }
      });
    });
  }

  loadSettlementInfo(): Promise<void> {
    return new Promise((resolve) => {
      this.merchantService.getSettlementInfo().subscribe({
        next: (data) => {
          this.settlement = data;
          resolve();
        },
        error: (error) => {
          console.error('Error loading settlement:', error);
          resolve();
        }
      });
    });
  }

  loadAccountStatus(): Promise<void> {
    return new Promise((resolve) => {
      this.merchantService.getAccountStatus().subscribe({
        next: (data) => {
          this.accountStatus = data;
          resolve();
        },
        error: (error) => {
          console.error('Error loading account status:', error);
          resolve();
        }
      });
    });
  }

  createChart() {
    const ctx = document.getElementById('salesChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    if (this.chart) {
      this.chart.destroy();
    }
    
    const labels = this.salesChartData.map(d => d.name);
    const values = this.salesChartData.map(d => d.value);
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Sales',
          data: values,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Sales: ${this.formatCurrency(context.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#e9ecef'
            },
            ticks: {
              callback: (value) => this.formatCurrency(Number(value))
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  // Navigation methods
  goToInstalments() {
    this.router.navigate(['/merchant/instalments']);
  }

  goToTransactions() {
    this.router.navigate(['/merchant/transactions']);
  }

  goToSettlements() {
    this.router.navigate(['/merchant/settlements']);
  }

  goToSettings() {
    this.router.navigate(['/merchant/settings']);
  }

  // Quick Actions
  createPaymentLink() {
    this.merchantService.quickAction('create_payment_link').subscribe({
      next: (response) => {
        alert(`Payment Link Created: ${response.link}`);
      },
      error: (error) => {
        console.error('Error creating payment link:', error);
        alert('Failed to create payment link');
      }
    });
  }

  createInstalmentPlan() {
    // Navigate to instalment plans page with create modal open
    this.router.navigate(['/merchant/instalments'], { queryParams: { action: 'create' } });
  }

  downloadReports() {
    this.merchantService.quickAction('download_reports').subscribe({
      next: () => {
        alert('Reports are being generated and will be emailed to you');
      },
      error: (error) => {
        console.error('Error downloading reports:', error);
        alert('Failed to download reports');
      }
    });
  }

  contactSupport() {
    this.merchantService.quickAction('contact_support').subscribe({
      next: () => {
        alert('Support ticket created. We will contact you shortly.');
      },
      error: (error) => {
        console.error('Error contacting support:', error);
        alert('Failed to create support ticket');
      }
    });
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
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  getTrendClass(rate: number): string {
    if (rate > 0) return 'trend-up';
    if (rate < 0) return 'trend-down';
    return '';
  }

  getTrendIcon(rate: number): string {
    if (rate > 0) return '↑';
    if (rate < 0) return '↓';
    return '→';
  }

  getTransactionTypeIcon(type: string): string {
    if (type === 'Installment Plan') return '📅';
    if (type === 'Refund') return '↩️';
    return '💰';
  }

  getInstalmentStatusClass(status: string): string {
    switch(status) {
      case 'active': return 'status-active';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      case 'overdue': return 'status-overdue';
      default: return 'status-default';
    }
  }
}