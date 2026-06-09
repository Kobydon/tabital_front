// src/app/admin/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminService } from '../admin.service';
import { Router } from '@angular/router';

// Import Chart.js with proper typing
import Chart from 'chart.js/auto';
import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js';

interface AlertItem {
  key: string;
  value: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  loading = false;
  stats: any = {};
  portfolio: any = {};
  alerts: any = {};
  alertsList: AlertItem[] = [];
  pendingApprovals: any = {};
  installmentStatus: any = {};
  topMerchants: any[] = [];
  recentTransactions: any[] = [];
  
  private portfolioChart: Chart | null = null;
  private installmentChart: Chart | null = null;

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    if (this.portfolioChart) {
      this.portfolioChart.destroy();
    }
    if (this.installmentChart) {
      this.installmentChart.destroy();
    }
  }

  loadDashboardData() {
    this.loading = true;
    this.adminService.getDashboardStats().subscribe({
      next: (response: any) => {
        this.stats = response.stats;
        this.portfolio = response.portfolio;
        this.alerts = response.alerts;
        // Convert alerts object to array for easier iteration
        this.alertsList = Object.entries(this.alerts).map(([key, value]) => ({ key, value: value as number }));
        this.pendingApprovals = response.pending_approvals;
        this.installmentStatus = response.installment_status;
        this.topMerchants = response.top_merchants || [];
        this.recentTransactions = response.recent_transactions || [];
        this.loading = false;
        setTimeout(() => {
          this.initCharts();
        }, 100);
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.loading = false;
      }
    });
  }

  // Portfolio Donut Chart
  initPortfolioChart() {
    const canvas = document.getElementById('portfolioChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.portfolioChart) {
      this.portfolioChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Chart data
    const chartData: ChartData<'doughnut'> = {
      labels: [
        `Early (31-60 days) ${this.portfolio.early_percentage || 0}%`,
        `Late (61-90 days) ${this.portfolio.late_percentage || 0}%`,
        `Default (90+ days) ${this.portfolio.default_percentage || 0}%`
      ],
      datasets: [{
        data: [
          this.portfolio.early_risk || 0,
          this.portfolio.late_risk || 0,
          this.portfolio.default_risk || 0
        ],
        backgroundColor: ['#f59e0b', '#ef4444', '#dc2626'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    };

    // Chart options
    const chartOptions: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 11 },
            boxWidth: 10
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${this.formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '60%'
    };

    // Create chart with proper typing
    this.portfolioChart = new Chart(ctx, {
      type: 'doughnut',
      data: chartData,
      options: chartOptions
    } as any);
  }

  // Installment Bar Chart
  initInstallmentChart() {
    const canvas = document.getElementById('installmentChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.installmentChart) {
      this.installmentChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Chart data
    const chartData: ChartData<'bar'> = {
      labels: ['Paid On Time', 'Paid Late', 'Upcoming', 'Overdue'],
      datasets: [{
        label: 'Number of Installments',
        data: [
          this.installmentStatus.paid_on_time || 0,
          this.installmentStatus.paid_late || 0,
          this.installmentStatus.upcoming || 0,
          this.installmentStatus.overdue || 0
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
        borderRadius: 8,
        barPercentage: 0.7,
        categoryPercentage: 0.8
      }]
    };

    // Chart options
    const chartOptions: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `${context.raw} installments`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Installments',
            font: { size: 12 }
          },
          grid: {
            color: '#e2e8f0'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Status',
            font: { size: 12 }
          },
          grid: {
            display: false
          }
        }
      }
    };

    // Create chart with proper typing
    this.installmentChart = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: chartOptions
    } as any);
  }

  // Alternative: Single method to initialize charts
  initCharts() {
    try {
      this.initPortfolioChart();
    } catch (error) {
      console.error('Error creating portfolio chart:', error);
    }
    
    try {
      this.initInstallmentChart();
    } catch (error) {
      console.error('Error creating installment chart:', error);
    }
  }

  getAlertTitle(alertKey: string): string {
    const titles: Record<string, string> = {
      'high_risk_transactions': 'High Risk Transactions',
      'failed_payments': 'Failed Payments',
      'overdue_installments': 'Overdue Installments',
      'chargebacks': 'Chargebacks / Disputes',
      'system_notifications': 'System Notifications'
    };
    return titles[alertKey] || alertKey.replace(/_/g, ' ');
  }

  getAlertIcon(alertKey: string): string {
    const icons: Record<string, string> = {
      'high_risk_transactions': 'fa-shield-alt',
      'failed_payments': 'fa-times-circle',
      'overdue_installments': 'fa-clock',
      'chargebacks': 'fa-undo-alt',
      'system_notifications': 'fa-bell'
    };
    return icons[alertKey] || 'fa-exclamation-triangle';
  }

  getAlertColor(alertKey: string): string {
    const colors: Record<string, string> = {
      'high_risk_transactions': '#ef4444',
      'failed_payments': '#f59e0b',
      'overdue_installments': '#dc2626',
      'chargebacks': '#8b5cf6',
      'system_notifications': '#3b82f6'
    };
    return colors[alertKey] || '#6b7280';
  }

  getStatusClass(status: string): string {
    switch(status.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'failed': return 'status-failed';
      default: return '';
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

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}