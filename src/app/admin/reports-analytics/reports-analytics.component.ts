import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { AdminService } from '../admin.service';
import Chart from 'chart.js/auto';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-reports-analytics',
  templateUrl: './reports-analytics.component.html',
  styleUrls: ['./reports-analytics.component.scss']
})
export class ReportsAnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  // Report Data
  Math = Math;
  revenueData: any[] = [];
  transactionData: any[] = [];
  customerData: any[] = [];
  merchantData: any[] = [];
  instalmentData: any[] = [];
  kpiData: any = {};
  
  // UI State
  isLoading = true;
  activeReportTab: 'revenue' | 'transactions' | 'customers' | 'merchants' | 'instalments' = 'revenue';
  selectedPeriod = 'monthly';
  selectedYear = new Date().getFullYear();
  availableYears: number[] = [];
  
  // Charts
  revenueChart: Chart | null = null;
  transactionChart: Chart | null = null;
  customerChart: Chart | null = null;
  merchantChart: Chart | null = null;
  instalmentChart: Chart | null = null;
  
  // KPIs
  kpis = [
    { label: 'YTD Revenue', value: 0, icon: '💰', color: 'green', change: 0, isCurrency: true },
    { label: 'Monthly Revenue', value: 0, icon: '📊', color: 'blue', change: 0, isCurrency: true },
    { label: 'Customer Growth', value: 0, icon: '👥', color: 'purple', change: 0, isCurrency: false, suffix: '%' },
    { label: 'Merchant Growth', value: 0, icon: '🏪', color: 'orange', change: 0, isCurrency: false, suffix: '%' },
    { label: 'Collection Rate', value: 0, icon: '✅', color: 'teal', change: 0, isCurrency: false, suffix: '%' }
  ];
  
  // Period Options
  periodOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.generateAvailableYears();
    this.loadKPIs();
    this.loadRevenueReport();
    this.loadTransactionReport();
    this.loadCustomerReport();
    this.loadMerchantReport();
    this.loadInstalmentReport();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data loads
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  generateAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 3; i <= currentYear + 1; i++) {
      this.availableYears.push(i);
    }
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadKPIs(): void {
    this.adminService.getDashboardKPIs().subscribe({
      next: (response: any) => {
        this.kpiData = response;
        this.updateKPIs();
      },
      error: (error) => console.error('Error loading KPIs:', error)
    });
  }

  updateKPIs(): void {
    this.kpis[0].value = this.kpiData.ytd_revenue || 0;
    this.kpis[1].value = this.kpiData.monthly_revenue || 0;
    this.kpis[2].value = this.kpiData.customer_growth || 0;
    this.kpis[3].value = this.kpiData.merchant_growth || 0;
    this.kpis[4].value = this.kpiData.collection_rate || 0;
  }

  // Computed properties for template
  get totalRevenue(): number {
    return this.revenueData.reduce((sum, d) => sum + d.revenue, 0);
  }

  get totalTransactions(): number {
    return this.revenueData.reduce((sum, d) => sum + d.transactions, 0);
  }

  get avgSuccessRate(): number {
    if (this.transactionData.length === 0) return 0;
    const total = this.transactionData.reduce((sum, d) => sum + d.success_rate, 0);
    return Math.round(total / this.transactionData.length);
  }

  loadRevenueReport(): void {
    const params = { period: this.selectedPeriod, year: this.selectedYear };
    this.adminService.getRevenueReport(params).subscribe({
      next: (response: any) => {
        this.revenueData = response.revenue_data || [];
        this.isLoading = false;
        setTimeout(() => this.initRevenueChart(), 100);
      },
      error: (error) => {
        console.error('Error loading revenue report:', error);
        this.isLoading = false;
      }
    });
  }

  loadTransactionReport(): void {
    const params = { period: this.selectedPeriod, year: this.selectedYear };
    this.adminService.getTransactionReport(params).subscribe({
      next: (response: any) => {
        this.transactionData = response.transaction_data || [];
        setTimeout(() => this.initTransactionChart(), 100);
      },
      error: (error) => console.error('Error loading transaction report:', error)
    });
  }

  loadCustomerReport(): void {
    const params = { period: this.selectedPeriod, year: this.selectedYear };
    this.adminService.getCustomerReport(params).subscribe({
      next: (response: any) => {
        this.customerData = response.customer_data || [];
        setTimeout(() => this.initCustomerChart(), 100);
      },
      error: (error) => console.error('Error loading customer report:', error)
    });
  }

  loadMerchantReport(): void {
    const params = { period: this.selectedPeriod, year: this.selectedYear };
    this.adminService.getMerchantReport(params).subscribe({
      next: (response: any) => {
        this.merchantData = response.merchant_data || [];
        setTimeout(() => this.initMerchantChart(), 100);
      },
      error: (error) => console.error('Error loading merchant report:', error)
    });
  }

  loadInstalmentReport(): void {
    const params = { period: this.selectedPeriod, year: this.selectedYear };
    this.adminService.getInstalmentReport(params).subscribe({
      next: (response: any) => {
        this.instalmentData = response.instalment_data || [];
        setTimeout(() => this.initInstalmentChart(), 100);
      },
      error: (error) => console.error('Error loading instalment report:', error)
    });
  }

  // ============================================
  // CHART INITIALIZATION
  // ============================================

  initRevenueChart(): void {
    const canvas = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    if (this.revenueChart) this.revenueChart.destroy();
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.revenueData.map(d => d.label),
        datasets: [
          {
            label: 'Revenue (GHS)',
            data: this.revenueData.map(d => d.revenue),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.4,
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'Transactions',
            data: this.revenueData.map(d => d.transactions),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            tension: 0.4,
            fill: true,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                let label = context.dataset.label || '';
                let value = context.raw;
                if (context.dataset.label?.includes('Revenue')) {
                  return `${label}: ${this.formatCurrency(value)}`;
                }
                return `${label}: ${value}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Revenue (GHS)' },
            ticks: { callback: (value) => this.formatCurrency(Number(value)) }
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            title: { display: true, text: 'Transactions' },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  initTransactionChart(): void {
    const canvas = document.getElementById('transactionChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    if (this.transactionChart) this.transactionChart.destroy();
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    this.transactionChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.transactionData.map(d => d.month),
        datasets: [
          {
            label: 'Completed',
            data: this.transactionData.map(d => d.completed),
            backgroundColor: '#10b981',
            borderRadius: 8
          },
          {
            label: 'Pending',
            data: this.transactionData.map(d => d.pending),
            backgroundColor: '#f59e0b',
            borderRadius: 8
          },
          {
            label: 'Failed',
            data: this.transactionData.map(d => d.failed),
            backgroundColor: '#ef4444',
            borderRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Number of Transactions' } } }
      }
    });
  }

  initCustomerChart(): void {
    const canvas = document.getElementById('customerChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    if (this.customerChart) this.customerChart.destroy();
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    this.customerChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.customerData.map(d => d.month),
        datasets: [
          {
            label: 'New Customers',
            data: this.customerData.map(d => d.new),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Active Customers',
            data: this.customerData.map(d => d.active),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Number of Customers' } } }
      }
    });
  }

  initMerchantChart(): void {
    const canvas = document.getElementById('merchantChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    if (this.merchantChart) this.merchantChart.destroy();
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    this.merchantChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.merchantData.map(d => d.month),
        datasets: [
          {
            label: 'GMV (GHS)',
            data: this.merchantData.map(d => d.gmv),
            backgroundColor: '#8b5cf6',
            borderRadius: 8,
            yAxisID: 'y'
          },
          {
            label: 'New Merchants',
            data: this.merchantData.map(d => d.new),
            backgroundColor: '#f59e0b',
            borderRadius: 8,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                let label = context.dataset.label || '';
                let value = context.raw;
                if (context.dataset.label?.includes('GMV')) {
                  return `${label}: ${this.formatCurrency(value)}`;
                }
                return `${label}: ${value}`;
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'GMV (GHS)' } },
          y1: { position: 'right', beginAtZero: true, title: { display: true, text: 'New Merchants' }, grid: { drawOnChartArea: false } }
        }
      }
    });
  }

  initInstalmentChart(): void {
    const canvas = document.getElementById('instalmentChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    if (this.instalmentChart) this.instalmentChart.destroy();
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    this.instalmentChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.instalmentData.map(d => d.month),
        datasets: [
          {
            label: 'Collection Rate (%)',
            data: this.instalmentData.map(d => d.collection_rate),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Active Plans',
            data: this.instalmentData.map(d => d.active_plans),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                let label = context.dataset.label || '';
                let value = context.raw;
                if (context.dataset.label?.includes('Rate')) {
                  return `${label}: ${value}%`;
                }
                return `${label}: ${value}`;
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, max: 100, title: { display: true, text: 'Collection Rate (%)' } },
          y1: { position: 'right', beginAtZero: true, title: { display: true, text: 'Active Plans' }, grid: { drawOnChartArea: false } }
        }
      }
    });
  }

  // ============================================
  // REPORT ACTIONS
  // ============================================

  switchReportTab(tab: 'revenue' | 'transactions' | 'customers' | 'merchants' | 'instalments'): void {
    this.activeReportTab = tab;
    setTimeout(() => {
      if (tab === 'revenue') this.initRevenueChart();
      else if (tab === 'transactions') this.initTransactionChart();
      else if (tab === 'customers') this.initCustomerChart();
      else if (tab === 'merchants') this.initMerchantChart();
      else if (tab === 'instalments') this.initInstalmentChart();
    }, 100);
  }

  applyFilters(): void {
    this.isLoading = true;
    this.loadRevenueReport();
    this.loadTransactionReport();
    this.loadCustomerReport();
    this.loadMerchantReport();
    this.loadInstalmentReport();
  }

  downloadReport(format: 'excel' | 'csv'): void {
    let reportType = '';
    switch (this.activeReportTab) {
      case 'revenue': reportType = 'revenue'; break;
      case 'transactions': reportType = 'transactions'; break;
      case 'customers': reportType = 'customers'; break;
      case 'merchants': reportType = 'merchants'; break;
      case 'instalments': reportType = 'instalments'; break;
    }
    
    const params = {
      type: reportType,
      format: format,
      period: this.selectedPeriod,
      year: this.selectedYear
    };
    
    this.adminService.downloadReport(params).subscribe({
      next: (blob: Blob) => {
        const extension = format === 'excel' ? 'xlsx' : 'csv';
        saveAs(blob, `${reportType}_report_${this.selectedYear}.${extension}`);
      },
      error: (error) => {
        console.error('Error downloading report:', error);
        alert('Failed to download report');
      }
    });
  }

  destroyCharts(): void {
    if (this.revenueChart) this.revenueChart.destroy();
    if (this.transactionChart) this.transactionChart.destroy();
    if (this.customerChart) this.customerChart.destroy();
    if (this.merchantChart) this.merchantChart.destroy();
    if (this.instalmentChart) this.instalmentChart.destroy();
  }

  // ============================================
  // HELPER METHODS
  // ============================================

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
}