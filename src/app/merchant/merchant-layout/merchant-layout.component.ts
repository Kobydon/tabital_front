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
  merchantEmail: string = 'merchant@email.com';
  merchantPhone: string = '';
  merchantAvatar: string = '🏪';
  merchantVerified: boolean = false;

  // ============================================
  // MENU
  // ============================================

  menuItems = [
    {
      path: '/merchant/dashboard',
      icon: '📊',
      label: 'Dashboard'
    },
     {
      path: '/merchant/products',
      icon: '📦',
      label: 'Products'
    },
    {
      path: '/merchant/orders',
      icon: '🛒',
      label: 'Orders'
    },
    {
      path: '/merchant/transactions',
      icon: '💸',
      label: 'Transactions'
    },
    // {
    //   path: '/merchant/instalments',
    //   icon: '📅',
    //   label: 'Instalments'
    // },
    {
      path: '/merchant/customers',
      icon: '👥',
      label: 'Customers'
    },
    // {
    //   path: '/merchant/settlements',
    //   icon: '💰',
    //   label: 'Settlements'
    // },
    {
      path: '/merchant/disputes',
      icon: '⚠️',
      label: 'Disputes'
    },
    {
      path: '/merchant/reports',
      icon: '📈',
      label: 'Reports'
    },

     {
      path: '/merchant/documents',
      icon: '📄',
      label: 'Documents'
    },
    {
      path: '/merchant/settings',
      icon: '⚙️',
      label: 'Account Settings'
    },
    // {
    //   path: '/merchant/notifications',
    //   icon: '🔔',
    //   label: 'Notifications'
    // },
    {
      path: '/merchant/support',
      icon: '💬',
      label: 'Support'
    },
    
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
          user.business_email ||
          'merchant@email.com';

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

        console.log('Merchant Loaded:', user);
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

    this.authService.logout();

    localStorage.clear();

    this.router.navigate(['/login']);
  }
}