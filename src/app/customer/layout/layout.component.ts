// src/app/customer/layout/layout.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { CustomerService, CustomerProfile } from 'src/app/customers.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-customer-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class CustomerLayoutComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  accountDropdownOpen = false;
  walletDropdownOpen = false;
  supportDropdownOpen = false;
  userMenuOpen = false;
  showNotifications = false;
  currentPageTitle = 'Dashboard';
  unreadCount = 0;
  walletBalance = 'AED 0.00';
  notifications: any[] = [];
  customerProfile: CustomerProfile | null = null;
  
  // For polling
  private notificationInterval: any;

  constructor(
    public router: Router,
    private authService: AuthService,
    private customerService: CustomerService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updatePageTitle();
      this.closeAllDropdowns();
    });
  }

  ngOnInit(): void {
    this.loadCustomerProfile();
    this.loadNotifications();
    this.loadUnreadCount();
    this.updatePageTitle();
    
    // Start polling for notifications
    this.startNotificationPolling();
    
    // Load sidebar state from localStorage
    const savedState = localStorage.getItem('customerSidebarCollapsed');
    if (savedState) {
      this.isSidebarCollapsed = savedState === 'true';
    }
  }

  ngOnDestroy(): void {
    // Clean up interval when component is destroyed
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }
  }

  startNotificationPolling(): void {
    // Poll for new notifications every 30 seconds
    this.notificationInterval = setInterval(() => {
      this.loadUnreadCount();
      this.loadNotifications(false);
    }, 30000);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile') && !target.closest('.user-menu')) {
      this.userMenuOpen = false;
    }
    if (!target.closest('.notifications')) {
      this.showNotifications = false;
    }
  }

  updatePageTitle(): void {
    const path = this.router.url;
    if (path.includes('/dashboard')) this.currentPageTitle = 'Dashboard';
    else if (path.includes('/payments')) this.currentPageTitle = 'My Payments';
    else if (path.includes('/instalments')) this.currentPageTitle = 'Instalments';
    else if (path.includes('/transactions')) this.currentPageTitle = 'Transactions';
    else if (path.includes('/plans')) this.currentPageTitle = 'Available Plans';
    else if (path.includes('/profile')) this.currentPageTitle = 'My Profile';
    else if (path.includes('/settings')) this.currentPageTitle = 'Settings';
    else if (path.includes('/notifications')) this.currentPageTitle = 'Notifications';
    else if (path.includes('/support')) this.currentPageTitle = 'Support';
    else if (path.includes('/referrals')) this.currentPageTitle = 'Referrals';
    else if (path.includes('/documents')) this.currentPageTitle = 'KYC Verification';
    else if (path.includes('/wallet')) this.currentPageTitle = 'My Wallet';
    else if (path.includes('/orders')) this.currentPageTitle = 'Orders';
    else if (path.includes('/shop')) this.currentPageTitle = 'Shop';
    else this.currentPageTitle = 'Dashboard';
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    localStorage.setItem('customerSidebarCollapsed', String(this.isSidebarCollapsed));
  }

  toggleAccountDropdown(): void {
    this.accountDropdownOpen = !this.accountDropdownOpen;
    this.walletDropdownOpen = false;
    this.supportDropdownOpen = false;
  }

  toggleWalletDropdown(): void {
    this.walletDropdownOpen = !this.walletDropdownOpen;
    this.accountDropdownOpen = false;
    this.supportDropdownOpen = false;
  }

  toggleSupportDropdown(): void {
    this.supportDropdownOpen = !this.supportDropdownOpen;
    this.accountDropdownOpen = false;
    this.walletDropdownOpen = false;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  closeAllDropdowns(): void {
    this.accountDropdownOpen = false;
    this.walletDropdownOpen = false;
    this.supportDropdownOpen = false;
    this.userMenuOpen = false;
    this.showNotifications = false;
  }

  loadCustomerProfile(): void {
    this.customerService.getProfile().subscribe({
      next: (data) => {
        this.customerProfile = data;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
      }
    });
  }

  loadNotifications(showLoading?: boolean): void {
    this.customerService.getCustomerNotifications({ limit: 10 }).subscribe({
      next: (response: any) => {
        this.notifications = (response.notifications || []).map((n: any) => ({
          id: n.id,
          notification_id: n.notification_id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.is_read,
          is_read: n.is_read,
          created_at: n.created_at,
          link: n.link,
          action_text: n.action_text,
          icon: n.icon
        }));
        this.updateUnreadCount();
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        // Fallback empty notifications
        this.notifications = [];
        this.updateUnreadCount();
      }
    });
  }

  loadUnreadCount(): void {
    this.customerService.getUnreadNotificationCount().subscribe({
      next: (response: any) => {
        this.unreadCount = response.unread_count;
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
        this.unreadCount = 0;
      }
    });
  }

  updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  markAsRead(notificationId: number): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      this.customerService.markNotificationRead(notificationId).subscribe({
        next: () => {
          notification.read = true;
          notification.is_read = true;
          this.updateUnreadCount();
          this.loadUnreadCount();
        },
        error: (error) => console.error('Error marking notification as read:', error)
      });
    }
  }

  markAllAsRead(): void {
    this.customerService.markAllNotificationsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => {
          n.read = true;
          n.is_read = true;
        });
        this.updateUnreadCount();
        this.loadUnreadCount();
      },
      error: (error) => console.error('Error marking all as read:', error)
    });
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-AE', { 
      style: 'currency', 
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}