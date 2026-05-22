// src/app/customer/components/notifications/notifications.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CustomerService } from 'src/app/customers.service';

export interface NotificationMessage {
  id: number;
  notification_id: string;
  title: string;
  message: string;
  type: 'payment' | 'transaction' | 'kyc' | 'promotion' | 'system' | 'order';
  is_read: boolean;
  read: boolean;
  created_at: string;
  link?: string;
  action_text?: string;
  icon?: string;
  extra_data?: any;
}

@Component({
  selector: 'app-customer-notifications',
  templateUrl: './customer-notifications.component.html',
  styleUrls: ['./customer-notifications.component.scss']
})
export class CustomerNotificationsComponent implements OnInit, OnDestroy {
  // Data
  notifications: NotificationMessage[] = [];
  filteredNotifications: NotificationMessage[] = [];
  selectedNotification: NotificationMessage | null = null;
  
  // UI State
  isLoading = true;
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 1;
  selectedFilter: 'all' | 'unread' | 'read' = 'all';
  selectedType: string = 'all';
  
  // Auto-refresh
  private refreshInterval: any;
  
  // Modal States
  showDetailsModal = false;
  
  // Form
  settingsForm: FormGroup;
  
  // Stats
  stats = {
    total: 0,
    unread: 0,
    read: 0
  };
  
  // Filter Options
 // In your notifications.component.ts, update the filterOptions type:

filterOptions: { value: 'all' | 'unread' | 'read'; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '📋' },
  { value: 'unread', label: 'Unread', icon: '🔴' },
  { value: 'read', label: 'Read', icon: '✅' }
];
  typeOptions = [
    { value: 'all', label: 'All Types', icon: '📋', color: '#6c757d' },
    { value: 'payment', label: 'Payments', icon: '💰', color: '#28a745' },
    { value: 'transaction', label: 'Transactions', icon: '🔄', color: '#17a2b8' },
    { value: 'kyc', label: 'KYC', icon: '🆔', color: '#ffc107' },
    { value: 'promotion', label: 'Promotions', icon: '🎁', color: '#f9a826' },
    { value: 'system', label: 'System', icon: '⚙️', color: '#6c757d' },
    { value: 'order', label: 'Orders', icon: '📦', color: '#f9a826' }
  ];
  
  // Settings options
  channelOptions = [
    { value: 'email_notifications', label: 'Email', icon: '📧' },
    { value: 'sms_notifications', label: 'SMS', icon: '📱' },
    { value: 'push_notifications', label: 'Push', icon: '🔔' }
  ];
  
  alertOptions = [
    { value: 'transaction_alerts', label: 'Transaction Alerts', icon: '🔄' },
    { value: 'settlement_alerts', label: 'Settlement Alerts', icon: '💰' },
    { value: 'dispute_alerts', label: 'Dispute Alerts', icon: '⚠️' }
  ];
  
  marketingOptions = [
    { value: 'promotional_emails', label: 'Promotional Emails', icon: '📧' },
    { value: 'newsletter', label: 'Newsletter', icon: '📰' }
  ];
  
  reportOptions = [
    { value: 'daily_summary', label: 'Daily Summary', icon: '📊' },
    { value: 'weekly_report', label: 'Weekly Report', icon: '📈' }
  ];

  constructor(
    private customerService: CustomerService,
    private fb: FormBuilder
  ) {
    this.settingsForm = this.fb.group({
      email_notifications: [true],
      sms_notifications: [true],
      push_notifications: [true],
      transaction_alerts: [true],
      settlement_alerts: [true],
      dispute_alerts: [true],
      promotional_emails: [false],
      newsletter: [false],
      daily_summary: [true],
      weekly_report: [true]
    });
  }

  ngOnInit(): void {
    this.loadNotifications();
    this.loadSettings();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  startAutoRefresh(): void {
    // Refresh notifications every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadNotifications(false);
    }, 30000);
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadSettings(): void {
    this.customerService.getNotificationSettings().subscribe({
      next: (response: any) => {
        this.settingsForm.patchValue(response);
      },
      error: (error) => {
        console.error('Error loading notification settings:', error);
      }
    });
  }

  loadNotifications(showLoading = true): void {
    if (showLoading) this.isLoading = true;
    
    const filters: any = {
      page: this.currentPage,
      limit: this.pageSize,
      read: this.selectedFilter !== 'all' ? this.selectedFilter === 'unread' ? 'false' : 'true' : '',
      type: this.selectedType !== 'all' ? this.selectedType : ''
    };
    
    this.customerService.getCustomerNotifications(filters).subscribe({
      next: (response: any) => {
        this.notifications = (response.notifications || []).map((n: any) => ({
          id: n.id,
          notification_id: n.notification_id,
          title: n.title,
          message: n.message,
          type: n.type,
          is_read: n.is_read,
          read: n.is_read,
          created_at: n.created_at,
          link: n.link,
          action_text: n.action_text,
          icon: n.icon,
          extra_data: n.extra_data
        }));
        this.filteredNotifications = this.notifications;
        this.totalItems = response.total || 0;
        this.totalPages = response.total_pages || 1;
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.isLoading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats.total = this.notifications.length;
    this.stats.unread = this.notifications.filter(n => !n.is_read).length;
    this.stats.read = this.stats.total - this.stats.unread;
  }

  // ============================================
  // FILTER METHODS
  // ============================================

  applyFilters(): void {
    let filtered = [...this.notifications];
    
    if (this.selectedFilter === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    } else if (this.selectedFilter === 'read') {
      filtered = filtered.filter(n => n.is_read);
    }
    
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(n => n.type === this.selectedType);
    }
    
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.filteredNotifications = filtered.slice(start, end);
  }

  filterByStatus(status: 'all' | 'unread' | 'read'): void {
    this.selectedFilter = status;
    this.currentPage = 1;
    this.applyFilters();
  }

  filterByType(type: string): void {
    this.selectedType = type;
    this.currentPage = 1;
    this.applyFilters();
  }

  resetFilters(): void {
    this.selectedFilter = 'all';
    this.selectedType = 'all';
    this.currentPage = 1;
    this.loadNotifications();
  }

  // ============================================
  // NOTIFICATION ACTIONS
  // ============================================

  markAsRead(notification: NotificationMessage): void {
    if (notification.is_read) return;
    
    this.customerService.markNotificationRead(notification.id).subscribe({
      next: () => {
        notification.is_read = true;
        notification.read = true;
        this.calculateStats();
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
        notification.is_read = true;
        notification.read = true;
        this.calculateStats();
        this.applyFilters();
      }
    });
  }

  markAllAsRead(): void {
    const unreadNotifications = this.notifications.filter(n => !n.is_read);
    if (unreadNotifications.length === 0) return;
    
    this.customerService.markAllNotificationsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => {
          n.is_read = true;
          n.read = true;
        });
        this.calculateStats();
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error marking all as read:', error);
      }
    });
  }

  deleteNotification(notification: NotificationMessage): void {
    if (confirm('Are you sure you want to delete this notification?')) {
      this.customerService.deleteNotification(notification.id).subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n.id !== notification.id);
          this.calculateStats();
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error deleting notification:', error);
        }
      });
    }
  }

  clearAll(): void {
    if (confirm('Are you sure you want to clear all notifications?')) {
      this.customerService.clearAllNotifications().subscribe({
        next: () => {
          this.notifications = [];
          this.calculateStats();
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error clearing notifications:', error);
        }
      });
    }
  }

  viewNotificationDetails(notification: NotificationMessage): void {
    this.selectedNotification = notification;
    this.showDetailsModal = true;
    
    if (!notification.is_read) {
      this.markAsRead(notification);
    }
  }

  closeModal(): void {
    this.showDetailsModal = false;
    this.selectedNotification = null;
  }

  // ============================================
  // SETTINGS ACTIONS
  // ============================================

  saveSettings(): void {
    this.customerService.updateNotificationSettings(this.settingsForm.value).subscribe({
      next: (response) => {
        alert('Notification settings saved successfully!');
      },
      error: (error) => {
        console.error('Error saving notification settings:', error);
        alert('Failed to save settings. Please try again.');
      }
    });
  }

  resetSettings(): void {
    if (confirm('Reset all notification settings to default?')) {
      this.settingsForm.reset({
        email_notifications: true,
        sms_notifications: true,
        push_notifications: true,
        transaction_alerts: true,
        settlement_alerts: true,
        dispute_alerts: true,
        promotional_emails: false,
        newsletter: false,
        daily_summary: true,
        weekly_report: true
      });
    }
  }

  // ============================================
  // PAGINATION
  // ============================================

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadNotifications();
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

  formatDate(dateString: string): string {
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

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      payment: '💰',
      transaction: '🔄',
      kyc: '🆔',
      promotion: '🎁',
      system: '⚙️',
      order: '📦'
    };
    return icons[type] || '📋';
  }

  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      payment: '#28a745',
      transaction: '#17a2b8',
      kyc: '#ffc107',
      promotion: '#f9a826',
      system: '#6c757d',
      order: '#f9a826'
    };
    return colors[type] || '#6c757d';
  }

  refresh(): void {
    this.loadNotifications();
  }
}