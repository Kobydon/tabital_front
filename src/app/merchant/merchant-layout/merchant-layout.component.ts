import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { AdminService, Merchant } from 'src/app/admin/admin.service';

@Component({
  selector: 'app-merchant-layout',
  templateUrl: './merchant-layout.component.html',
  styleUrls: ['./merchant-layout.component.scss']
})
export class MerchantLayoutComponent implements OnInit {

  // ============================================
  // SIDEBAR
  // ============================================

  isSidebarCollapsed: boolean = false;
  isMobile: boolean = false;
  showMobileSidebar: boolean = false;

  // ============================================
  // MERCHANT DATA
  // ============================================

  merchant!: Merchant;

  merchantName: string = 'Merchant Store';
  merchantEmail: string = '';
  merchantPhone: string = '';
  merchantAvatar: string = '';
  merchantVerified: boolean = false;

  // ============================================
  // MENU
  // ============================================

  // Vault navigation (grouped; Lucide icons, no emoji)
  readonly navGroups = [
    { label: 'Sell', items: [
      { path: '/merchant/dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
      { path: '/merchant/payment-links', label: 'Payment links and QR', icon: 'qr-code' },
      { path: '/merchant/orders', label: 'Orders', icon: 'package' },
      { path: '/merchant/products', label: 'Products', icon: 'store' },
      { path: '/merchant/customers', label: 'Customers', icon: 'users' },
    ]},
    { label: 'Money', items: [
      { path: '/merchant/settlements', label: 'Settlements and payouts', icon: 'landmark' },
      { path: '/merchant/transactions', label: 'Transactions', icon: 'arrow-right-left' },
      { path: '/merchant/reports', label: 'Reports', icon: 'chart-line' },
      { path: '/merchant/disputes', label: 'Disputes', icon: 'flag' },
    ]},
    { label: 'Account', items: [
      { path: '/merchant/documents', label: 'Business verification', icon: 'badge-check' },
      { path: '/merchant/settings', label: 'Settings', icon: 'settings' },
      { path: '/merchant/support', label: 'Support', icon: 'message-circle' },
    ]},
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private adminService: AdminService
  ) {}

  // ============================================
  // INIT
  // ============================================

  ngOnInit(): void {
    this.checkScreenSize();
    this.loadMerchantInfo();
  }

  // ============================================
  // SCREEN SIZE
  // ============================================

  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {

    this.isMobile = window.innerWidth <= 768;

    if (!this.isMobile) {
      this.showMobileSidebar = false;
    }
  }

  // ============================================
  // LOAD CURRENT MERCHANT
  // ============================================

  loadMerchantInfo(): void {

    this.adminService.getCurrentUser().subscribe({

      next: (user: Merchant) => {

        this.merchant = user;

        this.merchantName =
          user.business_name ||
          user.owner_name ||
          user.full_name ||
          'Merchant Store';

        this.merchantEmail =
          user.business_email || '';

        this.merchantPhone =
          user.business_phone ||
          user.phone ||
          '';

        this.merchantVerified =
          user.verified || false;

        // Avatar initials
        const firstLetter =
          this.merchantName.charAt(0).toUpperCase();

        this.merchantAvatar = firstLetter;

      },

      error: (error) => {

        console.error(
          'Failed to load merchant information',
          error
        );

        if (error.status === 401) {
          this.logout();
        }
      }
    });
  }

  // ============================================
  // SIDEBAR
  // ============================================

  toggleSidebar(): void {

    if (this.isMobile) {

      this.showMobileSidebar =
        !this.showMobileSidebar;

    } else {

      this.isSidebarCollapsed =
        !this.isSidebarCollapsed;
    }
  }

  closeMobileSidebar(): void {
    this.showMobileSidebar = false;
  }

  // ============================================
  // NAVIGATION
  // ============================================

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  navigate(path: string): void {

    this.router.navigate([path]);

    if (this.isMobile) {
      this.closeMobileSidebar();
    }
  }

  // ============================================
  // LOGOUT
  // ============================================

  logout(): void {

    this.authService.logout();      // clears the session (keeps only the fraud-check device id)
  }
}