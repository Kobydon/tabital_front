// src/app/customer/components/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, ChartData, ChartOptions } from 'chart.js';
import { CustomerService } from 'src/app/customers.service';

export interface DashboardStats {
  total_outstanding: number;
  total_outstanding_plans_count: number;
  next_payment_amount: number;
  next_payment_date: string;
  next_payment_plan_name: string;
  paid_to_date: number;
  paid_to_date_period: string;
  active_plans_count: number;
  account_status: string;
  account_status_message: string;
  customer_name?: string;
  customer_id?: string;
  email?: string;
  phone?: string;
}

export interface PaymentOverview {
  monthly_data: Array<{
    month: string;
    paid: number;
    outstanding: number;
  }>;
  total_paid: number;
  total_outstanding: number;
}

export interface InstalmentPlan {
  id: number;
  plan_id: string;
  transaction_id: string;
  product_name: string;
  product_description: string;
  merchant_name: string;
  merchant_phone: string;
  total_amount: number;
  amount_paid: number;
  amount_outstanding: number;
  instalment_term: number;
  instalment_frequency: string;
  instalment_amount: number;
  next_payment_date: string;
  next_payment_amount: number;
  due_date: string;
  status: 'active' | 'completed' | 'overdue' | 'defaulted';
  created_at: string;
  completed_at?: string;
}

export interface Transaction {
  id: number;
  transaction_id: string;
  merchant_name: string;
  product_name: string;
  product_description: string;
  amount: number;
  payment_method: string;
  payment_plan: string;
  status: string;
  transaction_date: string;
  delivery_status?: string;
}

export interface CustomerProfile {
  id: number;
  customer_id: string;
  full_name: string;
  email: string;
  phone: string;
  business_name?: string;
  city?: string;
  address?: string;
  gps?: string;
  status: string;
  kyc_status: string;
  kyc_level?: string;
  income_range?: string;
  created_at: string;
  total_spent?: number;
  active_plans_count?: number;
  completed_plans_count?: number;
}

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class CustomerDashboardComponent implements OnInit, OnDestroy {
  // Data properties
  stats: DashboardStats | null = null;
  paymentOverview: PaymentOverview | null = null;
  upcomingPayments: InstalmentPlan[] = [];
  recentTransactions: Transaction[] = [];
  activePlans: InstalmentPlan[] = [];
  customerProfile: CustomerProfile | null = null;
  
  // UI state properties
  isLoading = true;
  errorMessage = '';
  chartView: 'bar' | 'line' = 'bar';
  hasChartData = false;
  
  // Chart instance
  private paymentChart: Chart | null = null;
  private chartInitialized = false;

  constructor(
    private customerService: CustomerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    if (this.paymentChart) {
      this.paymentChart.destroy();
      this.paymentChart = null;
    }
  }

  // ============================================
  // DATA LOADING METHODS
  // ============================================

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.chartInitialized = false;
    
    Promise.all([
      this.loadStats(),
      this.loadPaymentOverview(),
      this.loadUpcomingPayments(),
      this.loadRecentTransactions(),
      this.loadActivePlans(),
      this.loadCustomerProfile()
    ]).catch((error) => {
      console.error('Error loading dashboard data:', error);
      this.errorMessage = 'Failed to load dashboard data. Please try again.';
    }).finally(() => {
      this.isLoading = false;
    });
  }

  private loadStats(): Promise<void> {
    return new Promise((resolve) => {
      this.customerService.getDashboardStats().subscribe({
        next: (data) => {
          this.stats = data;
          resolve();
        },
        error: (error) => {
          console.error('Error loading stats:', error);
          resolve();
        }
      });
    });
  }

  private loadPaymentOverview(): Promise<void> {
    return new Promise((resolve) => {
      this.customerService.getPaymentOverview().subscribe({
        next: (data) => {
          this.paymentOverview = data;
          this.hasChartData = data?.monthly_data?.some((m: any) => m.paid > 0 || m.outstanding > 0) || false;
          setTimeout(() => this.initPaymentChart(), 300);
          resolve();
        },
        error: (error) => {
          console.error('Error loading payment overview:', error);
          resolve();
        }
      });
    });
  }

  private loadUpcomingPayments(): Promise<void> {
    return new Promise((resolve) => {
      this.customerService.getUpcomingPayments(5).subscribe({
        next: (data) => {
          this.upcomingPayments = data || [];
          resolve();
        },
        error: (error) => {
          console.error('Error loading upcoming payments:', error);
          resolve();
        }
      });
    });
  }

  private loadRecentTransactions(): Promise<void> {
    return new Promise((resolve) => {
      this.customerService.getRecentTransactions(5).subscribe({
        next: (data) => {
          this.recentTransactions = data || [];
          resolve();
        },
        error: (error) => {
          console.error('Error loading recent transactions:', error);
          resolve();
        }
      });
    });
  }

  private loadActivePlans(): Promise<void> {
    return new Promise((resolve) => {
      this.customerService.getMyPlans({ status: 'active', limit: 3 }).subscribe({
        next: (data) => {
          this.activePlans = data?.plans || [];
          resolve();
        },
        error: (error) => {
          console.error('Error loading active plans:', error);
          resolve();
        }
      });
    });
  }

  private loadCustomerProfile(): Promise<void> {
    return new Promise((resolve) => {
      this.customerService.getProfile().subscribe({
        next: (data) => {
          this.customerProfile = data;
          resolve();
        },
        error: (error) => {
          console.error('Error loading customer profile:', error);
          resolve();
        }
      });
    });
  }

  // ============================================
  // CHART METHODS
  // ============================================

  private initPaymentChart(): void {
    if (!this.paymentOverview?.monthly_data?.length) {
      console.log('No payment overview data available');
      return;
    }

    const canvas = document.getElementById('paymentChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    if (this.paymentChart) {
      this.paymentChart.destroy();
      this.paymentChart = null;
    }

    const months = this.paymentOverview.monthly_data.map(d => d.month);
    const paidData = this.paymentOverview.monthly_data.map(d => d.paid || 0);
    const outstandingData = this.paymentOverview.monthly_data.map(d => d.outstanding || 0);

    const chartData: ChartData = {
      labels: months,
      datasets: [
        {
          label: 'Total Paid',
          data: paidData as number[],
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 2,
          tension: 0.4,
          fill: this.chartView === 'line',
          borderRadius: this.chartView === 'bar' ? 8 : 0,
          barPercentage: 0.7,
          categoryPercentage: 0.8
        },
        {
          label: 'Total Outstanding',
          data: outstandingData as number[],
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 2,
          tension: 0.4,
          fill: this.chartView === 'line',
          borderRadius: this.chartView === 'bar' ? 8 : 0,
          barPercentage: 0.7,
          categoryPercentage: 0.8
        }
      ]
    };

    const chartOptions: ChartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            boxWidth: 10,
            font: { size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += this.formatCurrency(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Amount (GHS)',
            font: { size: 12 }
          },
          ticks: {
            callback: (value: any) => 'GHS ' + value.toLocaleString()
          }
        },
        x: {
          title: {
            display: true,
            text: 'Month',
            font: { size: 12 }
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    };

    const config: ChartConfiguration = {
      type: this.chartView,
      data: chartData,
      options: chartOptions
    };

    this.paymentChart = new Chart(canvas, config);
    this.chartInitialized = true;
  }

  changeChartView(type: 'bar' | 'line'): void {
    this.chartView = type;
    this.initPaymentChart();
  }

  // ============================================
  // PAYMENT AND TRANSACTION METHODS
  // ============================================

  makePayment(plan: InstalmentPlan): void {
    if (!plan?.id) return;
    
    this.router.navigate(['/customer/make-payment'], { 
      queryParams: { 
        planId: plan.id,
        amount: plan.next_payment_amount,
        planName: plan.product_name
      }
    });
  }

  downloadStatement(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);
    
    this.customerService.downloadStatement({
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      format: 'pdf'
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `statement_${this.getCurrentDateForFilename()}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading statement:', error);
        this.errorMessage = 'Failed to download statement. Please try again.';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  requestPaymentReminder(): void {
    this.customerService.requestPaymentReminder().subscribe({
      next: () => alert('Payment reminder has been sent to your email and phone.'),
      error: (error) => {
        console.error('Error requesting payment reminder:', error);
        alert('Failed to send payment reminder. Please try again.');
      }
    });
  }

  // ============================================
  // PROFILE METHODS
  // ============================================

  copyToClipboard(text: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
  }

  upgradeKYC(): void {
    this.router.navigate(['/customer/profile'], { queryParams: { tab: 'kyc' } });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-GH', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
  }

  getCurrentDateForFilename(): string {
    return new Date().toISOString().split('T')[0];
  }

  getDaysRemaining(dateString: string): number {
    if (!dateString) return 0;
    const diffDays = Math.ceil((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  getPlanProgress(plan: InstalmentPlan): number {
    if (!plan?.total_amount) return 0;
    return Math.min((plan.amount_paid / plan.total_amount) * 100, 100);
  }

  getPaidTrend(): number {
    if (!this.paymentOverview?.monthly_data?.length) return 0;
    const data = this.paymentOverview.monthly_data;
    const current = data[data.length - 1]?.paid || 0;
    const previous = data[data.length - 2]?.paid || 0;
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  getOutstandingTrend(): number {
    if (!this.paymentOverview?.monthly_data?.length) return 0;
    const data = this.paymentOverview.monthly_data;
    const current = data[data.length - 1]?.outstanding || 0;
    const previous = data[data.length - 2]?.outstanding || 0;
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'active': 'status-active',
      'completed': 'status-completed',
      'overdue': 'status-overdue',
      'pending': 'status-pending',
      'failed': 'status-failed'
    };
    return classes[status?.toLowerCase()] || '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GH', { 
      style: 'currency', currency: 'GHS', minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(amount || 0);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GH', { 
        day: 'numeric', month: 'short', year: 'numeric' 
      });
    } catch {
      return 'Invalid Date';
    }
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GH', { 
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
    } catch {
      return 'Invalid Date';
    }
  }

  retryLoading(): void {
    this.chartInitialized = false;
    this.loadDashboardData();
  }
}