import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MerchantService } from 'src/app/merchant.service';

@Component({
  selector: 'app-merchant-reports',
  templateUrl: './merchant-reports.component.html',
  styleUrls: ['./merchant-reports.component.scss']
})
export class MerchantReportsComponent implements OnInit, OnDestroy {
  activeTab = 'sales';
  isLoading = false;
  Math = Math;
  
  // Date range
  dateRangeForm: FormGroup;
  reportType = 'daily';
  selectedYear = new Date().getFullYear();
  
  // Report data
  salesReport: any = null;
  transactionReport: any = null;
  customerReport: any = null;
  financialReport: any = null;
  instalmentReport: any = null;
  
  // Charts
  private salesChart: any = null;
  private transactionChart: any = null;
  private customerChart: any = null;
  private financialChart: any = null;
  
  years: number[] = [];
  
  constructor(
    private merchantService: MerchantService,
    private fb: FormBuilder
  ) {
    this.dateRangeForm = this.fb.group({
      start_date: [''],
      end_date: ['']
    });
    
    // Generate last 5 years
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
      this.years.push(i);
    }
  }

  ngOnInit(): void {
    this.setDefaultDateRange();
    this.loadReports();
  }

  ngOnDestroy(): void {
    // Destroy all charts to prevent memory leaks
    this.destroyCharts();
  }

  destroyCharts(): void {
    if (this.salesChart) {
      this.salesChart.destroy();
      this.salesChart = null;
    }
    if (this.transactionChart) {
      this.transactionChart.destroy();
      this.transactionChart = null;
    }
    if (this.customerChart) {
      this.customerChart.destroy();
      this.customerChart = null;
    }
    if (this.financialChart) {
      this.financialChart.destroy();
      this.financialChart = null;
    }
  }

  setDefaultDateRange() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    this.dateRangeForm.patchValue({
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    });
  }

  loadReports() {
    this.isLoading = true;
    
    switch(this.activeTab) {
      case 'sales':
        this.loadSalesReport();
        break;
      case 'transactions':
        this.loadTransactionReport();
        break;
      case 'customers':
        this.loadCustomerReport();
        break;
      case 'financial':
        this.loadFinancialReport();
        break;
      case 'instalments':
        this.loadInstalmentReport();
        break;
      default:
        this.isLoading = false;
    }
  }

  loadSalesReport() {
    const params = {
      type: this.reportType,
      start_date: this.dateRangeForm.value.start_date,
      end_date: this.dateRangeForm.value.end_date
    };
    
    this.merchantService.getSalesReport(params).subscribe({
      next: (data) => {
        this.salesReport = data;
        setTimeout(() => this.createSalesChart(), 200);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading sales report:', error);
        this.salesReport = null;
        this.isLoading = false;
      }
    });
  }

  loadTransactionReport() {
    const params = {
      start_date: this.dateRangeForm.value.start_date,
      end_date: this.dateRangeForm.value.end_date
    };
    
    this.merchantService.getTransactionReport(params).subscribe({
      next: (data) => {
        this.transactionReport = data;
        setTimeout(() => this.createTransactionChart(), 200);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transaction report:', error);
        this.transactionReport = null;
        this.isLoading = false;
      }
    });
  }

  loadCustomerReport() {
    const params = {
      start_date: this.dateRangeForm.value.start_date,
      end_date: this.dateRangeForm.value.end_date
    };
    
    this.merchantService.getCustomerReport(params).subscribe({
      next: (data) => {
        this.customerReport = data;
        setTimeout(() => this.createCustomerChart(), 200);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customer report:', error);
        this.customerReport = null;
        this.isLoading = false;
      }
    });
  }

  loadFinancialReport() {
    const params = {
      year: this.selectedYear
    };
    
    this.merchantService.getFinancialReport(params).subscribe({
      next: (data) => {
        this.financialReport = data;
        setTimeout(() => this.createFinancialChart(), 200);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading financial report:', error);
        this.financialReport = null;
        this.isLoading = false;
      }
    });
  }

  loadInstalmentReport() {
    this.merchantService.getInstalmentReport().subscribe({
      next: (data) => {
        this.instalmentReport = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading instalment report:', error);
        this.instalmentReport = null;
        this.isLoading = false;
      }
    });
  }

  createSalesChart() {
    if (!this.salesReport?.report_data || this.salesReport.report_data.length === 0) return;
    
    const canvas = document.getElementById('salesChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    // Destroy existing chart
    if (this.salesChart) {
      this.salesChart.destroy();
      this.salesChart = null;
    }
    
    const labels = this.salesReport.report_data.map((d: any) => d.period);
    const sales = this.salesReport.report_data.map((d: any) => d.sales);
    
    import('chart.js/auto').then((Chart) => {
      this.salesChart = new Chart.default(canvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Sales',
            data: sales,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: (context: any) => `Sales: ${this.formatCurrency(context.parsed.y)}`
              }
            }
          }
        }
      });
    }).catch(err => console.error('Chart.js import error:', err));
  }

  createTransactionChart() {
    if (!this.transactionReport?.hourly_distribution) return;
    
    const canvas = document.getElementById('transactionChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    if (this.transactionChart) {
      this.transactionChart.destroy();
      this.transactionChart = null;
    }
    
    const hours = Object.keys(this.transactionReport.hourly_distribution).sort();
    const counts = hours.map(h => this.transactionReport.hourly_distribution[h]);
    
    import('chart.js/auto').then((Chart) => {
      this.transactionChart = new Chart.default(canvas, {
        type: 'bar',
        data: {
          labels: hours.map(h => `${h}:00`),
          datasets: [{
            label: 'Transactions',
            data: counts,
            backgroundColor: '#4facfe',
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: (context: any) => `${context.parsed.y} transactions`
              }
            }
          }
        }
      });
    });
  }

  createCustomerChart() {
    if (!this.customerReport?.customer_segments) return;
    
    const canvas = document.getElementById('customerChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    if (this.customerChart) {
      this.customerChart.destroy();
      this.customerChart = null;
    }
    
    const segments = this.customerReport.customer_segments;
    
    import('chart.js/auto').then((Chart) => {
      this.customerChart = new Chart.default(canvas, {
        type: 'doughnut',
        data: {
          labels: ['High Value (>GHS 5,000)', 'Medium Value (GHS 1k-5k)', 'Low Value (<GHS 1k)'],
          datasets: [{
            data: [
              segments.high_value?.count || 0,
              segments.medium_value?.count || 0,
              segments.low_value?.count || 0
            ],
            backgroundColor: ['#28a745', '#fd7e14', '#6c757d'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    });
  }

  createFinancialChart() {
    if (!this.financialReport?.monthly_breakdown) return;
    
    const canvas = document.getElementById('financialChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    if (this.financialChart) {
      this.financialChart.destroy();
      this.financialChart = null;
    }
    
    const months = this.financialReport.monthly_breakdown.map((m: any) => m.month);
    const sales = this.financialReport.monthly_breakdown.map((m: any) => m.total_sales);
    const net = this.financialReport.monthly_breakdown.map((m: any) => m.net_income);
    
    import('chart.js/auto').then((Chart) => {
      this.financialChart = new Chart.default(canvas, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [
            {
              label: 'Total Sales',
              data: sales,
              backgroundColor: '#667eea',
              borderRadius: 8
            },
            {
              label: 'Net Income',
              data: net,
              backgroundColor: '#28a745',
              borderRadius: 8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: (context: any) => `${context.dataset.label}: ${this.formatCurrency(context.parsed.y)}`
              }
            }
          }
        }
      });
    });
  }

  onTabChange(tab: string) {
    this.activeTab = tab;
    this.loadReports();
  }

  onDateRangeChange() {
    this.loadReports();
  }

  onReportTypeChange() {
    this.loadSalesReport();
  }

  onYearChange() {
    this.loadFinancialReport();
  }

  exportReport() {
    let type = '';
    switch(this.activeTab) {
      case 'sales':
        type = 'sales';
        break;
      case 'transactions':
        type = 'transactions';
        break;
      case 'customers':
        type = 'customers';
        break;
      default:
        type = 'sales';
    }
    
    const params: any = { type };
    if (this.dateRangeForm.value.start_date) params.start_date = this.dateRangeForm.value.start_date;
    if (this.dateRangeForm.value.end_date) params.end_date = this.dateRangeForm.value.end_date;
    if (this.activeTab === 'financial') params.year = this.selectedYear;
    
    this.merchantService.exportReport(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        alert('Export started');
      },
      error: (error) => {
        console.error('Error exporting report:', error);
        alert('Failed to export report');
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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'refunded': return 'status-refunded';
      default: return 'status-default';
    }
  }

  getPaymentMethodsArray(paymentMethods: any): any[] {
    if (!paymentMethods) return [];
    return Object.keys(paymentMethods).map(key => ({
      key: key,
      value: paymentMethods[key]
    }));
  }

  getStatusBreakdownArray(statusBreakdown: any): any[] {
    if (!statusBreakdown) return [];
    return Object.keys(statusBreakdown).map(key => ({
      key: key,
      value: statusBreakdown[key]
    }));
  }

  getInstalmentCountsArray(instalmentCounts: any): any[] {
    if (!instalmentCounts) return [];
    return Object.keys(instalmentCounts).map(key => ({
      key: key,
      value: instalmentCounts[key]
    }));
  }

  getPercentage(value: number, total: number): number {
    if (!total || total === 0) return 0;
    return (value / total) * 100;
  }

  refresh(): void {
    this.loadReports();
  }
}