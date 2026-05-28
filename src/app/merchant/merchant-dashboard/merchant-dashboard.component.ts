// src/app/merchant/components/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Chart } from 'chart.js';
import { Router } from '@angular/router';
import { MerchantService } from 'src/app/merchant.service';

@Component({
  selector: 'app-merchant-dashboard',
  templateUrl: './merchant-dashboard.component.html',
  styleUrls: ['./merchant-dashboard.component.scss']
})
export class MerchantDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  isLoading = true;
  merchantName = '';
  Math = Math;
  unreadCount = 0;
  showNotifications = false;
  notifications: any[] = [];
  
  // KYC Status
  kycStatus: string = 'pending';
  kycVerificationLevel: string = 'basic';
  kycMessage: string = '';
  showKYCWarning: boolean = false;
  
  // Polling interval
  private notificationInterval: any;
  
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
  
  // Payout Stats
  payoutStats = {
    totalPayout: 0,
    totalCommission: 0,
    pendingPayout: 0,
    paidPayout: 0,
    thisMonthPayout: 0,
    lastMonthPayout: 0,
    payoutGrowth: 0
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
    totalActiveAmount: 0,
    totalPayout: 0
  };
  
  // Settlement Info
  settlement = {
    nextSettlement: '',
    estimatedAmount: 0,
    estimatedPayout: 0
  };
  
  // Account Status
  accountStatus = {
    kycVerified: false,
    payoutAccount: '',
    plan: '',
    memberSince: '',
    defaultCommissionRate: 10,
    kycStatus: 'pending',
    kycMessage: ''
  };

  constructor(
    private merchantService: MerchantService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadMerchantInfo();
    this.loadUnreadCount();
    this.loadKYCStatus();
    this.startNotificationPolling();
  }

  ngOnDestroy(): void {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }
    if (this.chart) {
      this.chart.destroy();
    }
  }

  ngAfterViewInit(): void {
    // Chart will be created after data loads
  }

  startNotificationPolling(): void {
    this.notificationInterval = setInterval(() => {
      this.loadUnreadCount();
    }, 30000);
  }

  loadMerchantInfo() {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.merchantName = user.business_name || user.full_name || 'Merchant';
    }
  }

  loadKYCStatus(): void {
    this.merchantService.getKycStatus().subscribe({
      next: (response: any) => {
        this.kycStatus = response.status;
        this.kycVerificationLevel = response.level || 'basic';
        
        // Update account status
        this.accountStatus.kycVerified = this.kycStatus === 'verified';
        this.accountStatus.kycStatus = this.kycStatus;
        
        // Set KYC warning message based on status
        if (this.kycStatus === 'pending') {
          this.showKYCWarning = true;
          this.kycMessage = 'Your KYC verification is pending. Please complete your verification to access all merchant features.';
          this.accountStatus.kycMessage = this.kycMessage;
        } else if (this.kycStatus === 'rejected') {
          this.showKYCWarning = true;
          this.kycMessage = response.rejection_reason || 'Your KYC verification was rejected. Please re-upload your documents.';
          this.accountStatus.kycMessage = this.kycMessage;
        } else if (this.kycStatus === 'verified') {
          this.showKYCWarning = false;
          this.kycMessage = '';
        }
      },
      error: (error) => {
        console.error('Error loading KYC status:', error);
        this.kycStatus = 'pending';
        this.showKYCWarning = true;
        this.kycMessage = 'Please complete your KYC verification to start selling.';
      }
    });
  }

  navigateToKYCDocuments(): void {
    this.router.navigate(['/merchant/documents']);
  }

  loadUnreadCount(): void {
    this.merchantService.getMerchantUnreadCount().subscribe({
      next: (response: any) => {
        this.unreadCount = response.unread_count;
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
      }
    });
  }

  loadNotifications(): void {
    this.merchantService.getMerchantNotifications({ limit: 5 }).subscribe({
      next: (response: any) => {
        this.notifications = (response.notifications || []).slice(0, 5).map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read || false,
          created_at: n.created_at,
          link: n.link,
          action_text: n.action_text
        }));
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
      }
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  markAsRead(notificationId: string, event: Event): void {
    event.stopPropagation();
    this.merchantService.markMerchantNotificationRead(notificationId).subscribe({
      next: () => {
        this.loadUnreadCount();
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) notification.read = true;
      },
      error: (error) => console.error('Error marking notification as read:', error)
    });
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    this.merchantService.markAllMerchantNotificationsRead().subscribe({
      next: () => {
        this.unreadCount = 0;
        this.notifications.forEach(n => n.read = true);
      },
      error: (error) => console.error('Error marking all as read:', error)
    });
  }

  viewNotification(notification: any): void {
    if (notification.link) {
      this.router.navigate([notification.link]);
    }
    this.showNotifications = false;
  }

  formatNotificationTime(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-GH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  }

  loadDashboardData() {
    this.isLoading = true;
    
    Promise.all([
      this.loadStats(),
      this.loadSalesChart(),
      this.loadRecentTransactions(),
      this.loadInstalmentsOverview(),
      this.loadSettlementInfo(),
      this.loadAccountStatus(),
      this.loadPayoutStats()
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

  loadPayoutStats(): Promise<void> {
    return new Promise((resolve) => {
      this.merchantService.getTransactionStats().subscribe({
        next: (data: any) => {
          if (data.total_payout !== undefined) {
            this.payoutStats = {
              totalPayout: data.total_payout || 0,
              totalCommission: data.total_commission || 0,
              pendingPayout: data.pending_payout || 0,
              paidPayout: data.paid_payout || 0,
              thisMonthPayout: data.this_month_payout || 0,
              lastMonthPayout: data.last_month_payout || 0,
              payoutGrowth: data.payout_growth || 0
            };
          } else {
            this.payoutStats = {
              totalPayout: data.total_payout || data.this_month?.payout || data.today?.payout || 0,
              totalCommission: data.total_commission || 0,
              pendingPayout: data.pending_payout || data.status_breakdown?.pending?.payout || 0,
              paidPayout: data.paid_payout || data.status_breakdown?.completed?.payout || 0,
              thisMonthPayout: data.this_month?.payout || data.this_month_payout || 0,
              lastMonthPayout: data.last_month_payout || 0,
              payoutGrowth: data.payout_growth || 0
            };
          }
          console.log('Payout Stats loaded:', this.payoutStats);
          resolve();
        },
        error: (error) => {
          console.error('Error loading payout stats:', error);
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
          this.salesChartData = [
            { name: '14 May', value: 18500, payout: 16650 },
            { name: '15 May', value: 19200, payout: 17280 },
            { name: '16 May', value: 17800, payout: 16020 },
            { name: '17 May', value: 20500, payout: 18450 },
            { name: '18 May', value: 22800, payout: 20520 },
            { name: '19 May', value: 24300, payout: 21870 },
            { name: '20 May', value: 25430, payout: 22887 }
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
          this.recentTransactions = data.map((t: any) => ({
            ...t,
            payout_amount: t.payout_amount || (t.amount * 0.9),
            commission_amount: t.commission_amount || (t.amount * 0.1)
          }));
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
          this.instalmentsOverview = {
            ...data,
            totalPayout: data.total_active_amount * 0.9 || 0
          };
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
          this.settlement = {
            ...data,
            estimatedPayout: (data.estimatedAmount || 0) * 0.9
          };
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
          this.accountStatus = {
            ...data,
            defaultCommissionRate: 10
          };
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
    const salesValues = this.salesChartData.map(d => d.value);
    const payoutValues = this.salesChartData.map(d => d.payout || d.value * 0.9);
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Sales',
            data: salesValues,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 3,
            pointBackgroundColor: '#667eea',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.4,
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'Your Payout (after 10% commission)',
            data: payoutValues,
            borderColor: '#48bb78',
            backgroundColor: 'rgba(72, 187, 120, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: '#48bb78',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            tension: 0.4,
            fill: true,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              boxWidth: 10
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: ${this.formatCurrency(value)}`;
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
            },
            title: {
              display: true,
              text: 'Amount (GHS)'
            }
          },
          x: {
            grid: {
              display: false
            },
            title: {
              display: true,
              text: 'Date'
            }
          }
        }
      }
    });
  }

  getPayoutBreakdown(amount: number): { commission: number, payout: number, commissionRate: number } {
    const commissionRate = 10;
    const commission = amount * (commissionRate / 100);
    const payout = amount - commission;
    return { commission, payout, commissionRate };
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

  goToNotifications() {
    this.router.navigate(['/merchant/notifications']);
    this.showNotifications = false;
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
      currency: 'GHS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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