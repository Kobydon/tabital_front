// src/app/merchant/components/notifications/notifications.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MerchantService } from '../../merchant.service';

export type FilterStatus = 'all' | 'unread' | 'read';
export type NotificationType = 'order' | 'payment' | 'kyc' | 'settlement' | 'warning' | 'success' | 'system';

export interface MerchantNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
  link?: string;
  action_text?: string;
}

@Component({
  selector: 'app-merchant-notifications',
  templateUrl: './merchant-notifications.component.html',
  styleUrls: ['./merchant-notifications.component.scss']
})
export class MerchantNotificationsComponent implements OnInit, OnDestroy {
  // Data
  notifications: MerchantNotification[] = [];
  filteredNotifications: MerchantNotification[] = [];
  selectedNotification: MerchantNotification | null = null;
  
  // UI State
  isLoading = true;
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 1;
  selectedFilter: FilterStatus = 'all';
  selectedType: NotificationType | 'all' = 'all';
  
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
  
  // Filter Options with proper typing
  filterOptions: { value: FilterStatus; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: '📋' },
    { value: 'unread', label: 'Unread', icon: '🔴' },
    { value: 'read', label: 'Read', icon: '✅' }
  ];
  
  typeOptions: { value: NotificationType | 'all'; label: string; icon: string; color: string }[] = [
    { value: 'all', label: 'All Types', icon: '📋', color: '#6c757d' },
    { value: 'order', label: 'Orders', icon: '📦', color: '#f9a826' },
    { value: 'payment', label: 'Payments', icon: '💰', color: '#28a745' },
    { value: 'kyc', label: 'KYC', icon: '🆔', color: '#ffc107' },
    { value: 'settlement', label: 'Settlements', icon: '🏦', color: '#17a2b8' },
    { value: 'warning', label: 'Warnings', icon: '⚠️', color: '#dc3545' },
    { value: 'success', label: 'Success', icon: '✅', color: '#28a745' },
    { value: 'system', label: 'System', icon: '⚙️', color: '#6c757d' }
  ];
  
  // Settings options
  channelOptions = [
    { value: 'email_notifications', label: 'Email', icon: '📧' },
    { value: 'sms_notifications', label: 'SMS', icon: '📱' },
    { value: 'push_notifications', label: 'Push', icon: '🔔' }
  ];
  
  alertOptions = [
    { value: 'order_alerts', label: 'Order Alerts', icon: '📦' },
    { value: 'payment_alerts', label: 'Payment Alerts', icon: '💰' },
    { value: 'settlement_alerts', label: 'Settlement Alerts', icon: '🏦' },
    { value: 'dispute_alerts', label: 'Dispute Alerts', icon: '⚠️' }
  ];
  
  reportOptions = [
    { value: 'daily_summary', label: 'Daily Summary', icon: '📊' },
    { value: 'weekly_report', label: 'Weekly Report', icon: '📈' }
  ];

  constructor(
    private merchantService: MerchantService,
    private fb: FormBuilder
  ) {
    this.settingsForm = this.fb.group({
      email_notifications: [true],
      sms_notifications: [true],
      push_notifications: [true],
      order_alerts: [true],
      payment_alerts: [true],
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
    this.refreshInterval = setInterval(() => {
      this.loadNotifications(false);
    }, 30000);
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadSettings(): void {
    this.merchantService.getMerchantNotificationSettings().subscribe({
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
    
    this.merchantService.getMerchantNotifications(filters).subscribe({
      next: (response: any) => {
        this.notifications = (response.notifications || []).map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read || false,
          created_at: n.created_at,
          link: n.link,
          action_text: n.action_text
        }));
        this.filteredNotifications = this.notifications;
        this.totalItems = response.total || this.notifications.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.isLoading = false;
        this.notifications = [];
        this.filteredNotifications = [];
      }
    });
  }

  calculateStats(): void {
    this.stats.total = this.notifications.length;
    this.stats.unread = this.notifications.filter(n => !n.read).length;
    this.stats.read = this.stats.total - this.stats.unread;
  }

  // ============================================
  // FILTER METHODS
  // ============================================

  applyFilters(): void {
    let filtered = [...this.notifications];
    
    if (this.selectedFilter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (this.selectedFilter === 'read') {
      filtered = filtered.filter(n => n.read);
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

  filterByStatus(status: FilterStatus): void {
    this.selectedFilter = status;
    this.currentPage = 1;
    this.applyFilters();
  }

  filterByType(type: NotificationType | 'all'): void {
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

  markAsRead(notification: MerchantNotification): void {
    if (notification.read) return;
    
    this.merchantService.markMerchantNotificationRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
        this.calculateStats();
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
        notification.read = true;
        this.calculateStats();
        this.applyFilters();
      }
    });
  }

  markAllAsRead(): void {
    const unreadNotifications = this.notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;
    
    this.merchantService.markAllMerchantNotificationsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.read = true);
        this.calculateStats();
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error marking all as read:', error);
      }
    });
  }

  deleteNotification(notification: MerchantNotification): void {
    if (confirm('Are you sure you want to delete this notification?')) {
      this.merchantService.deleteMerchantNotification(notification.id).subscribe({
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
      this.merchantService.clearAllMerchantNotifications().subscribe({
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

  viewNotificationDetails(notification: MerchantNotification): void {
    this.selectedNotification = notification;
    this.showDetailsModal = true;
    
    if (!notification.read) {
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
    this.merchantService.updateMerchantNotificationSettings(this.settingsForm.value).subscribe({
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
        order_alerts: true,
        payment_alerts: true,
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
      order: '📦',
      payment: '💰',
      kyc: '🆔',
      settlement: '🏦',
      warning: '⚠️',
      success: '✅',
      system: '⚙️'
    };
    return icons[type] || '📋';
  }

  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      order: '#f9a826',
      payment: '#28a745',
      kyc: '#ffc107',
      settlement: '#17a2b8',
      warning: '#dc3545',
      success: '#28a745',
      system: '#6c757d'
    };
    return colors[type] || '#6c757d';
  }

  refresh(): void {
    this.loadNotifications();
  }
}