import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { AdminAccess } from 'src/app/ui/admin-access';

interface NavItem { path: string; label: string; icon: string; exact?: boolean; management?: boolean; }

@Component({
  selector: 'app-admin-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  isCollapsed = false;
  isMobileOpen = false;  // New state for mobile sidebar visibility
  activeDropdown: string | null = null;
  showUserMenu = false;
  isMobile = false;

  // Vault navigation: only routes that exist, grouped by job (Lucide icons, no emoji).
  // management: true = Management Access only (the server refuses anyone else).
  private readonly allNavGroups: { label: string; items: NavItem[] }[] = [
    { label: 'Overview', items: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: 'layout-dashboard', exact: true },
      { path: '/admin/unit-economics', label: 'Unit economics', icon: 'trending-up', management: true },
      { path: '/admin/all-reports', label: 'Reports', icon: 'chart-line' },
    ]},
    { label: 'Approvals', items: [
      { path: '/admin/orders', label: 'Orders', icon: 'clipboard-list' },
      { path: '/admin/kyc-verification', label: 'Customer KYC', icon: 'id-card' },
      { path: '/admin/kyb-verification', label: 'Merchant KYB', icon: 'badge-check' },
      { path: '/admin/identity-review', label: 'Identity review', icon: 'scan-face' },
      { path: '/admin/fraud-review', label: 'Fraud review', icon: 'shield-check' },
    ]},
    { label: 'Loans', items: [
      { path: '/admin/all-installments', label: 'Instalments', icon: 'calendar-clock' },
      { path: '/admin/collections', label: 'Collections', icon: 'phone-call' },
      { path: '/admin/disputes', label: 'Disputes', icon: 'flag' },
    ]},
    { label: 'Money', items: [
      { path: '/admin/settlements', label: 'Merchant settlements', icon: 'landmark' },
      { path: '/admin/all-transactions', label: 'Transactions', icon: 'arrow-right-left' },
    ]},
    { label: 'People', items: [
      { path: '/admin/customer-overview', label: 'Customers', icon: 'users' },
      { path: '/admin/merchant-overview', label: 'Merchants', icon: 'store' },
      { path: '/admin/product-plans', label: 'Products', icon: 'package' },
      { path: '/admin/all-users', label: 'All users', icon: 'user' },
    ]},
    { label: 'Settings', items: [
      { path: '/admin/system-settings', label: 'Rates and rules', icon: 'sliders-horizontal', management: true },
      { path: '/admin/team', label: 'Team and access', icon: 'user-cog', management: true },
      { path: '/admin/data-access', label: 'Personal data access', icon: 'eye', management: true },
    ]},
  ];

  navGroups: { label: string; items: NavItem[] }[] = [];

  constructor(private router: Router, public access: AdminAccess) {
    this.checkScreenSize();
    this.navGroups = this.visibleGroups();
    access.load(true);          // fresh after every sign-in
    access.changes.subscribe(() => this.navGroups = this.visibleGroups());
  }

  private visibleGroups(): { label: string; items: NavItem[] }[] {
    const management = this.access.isManagement;
    return this.allNavGroups
      .map(g => ({ ...g, items: g.items.filter(i => management || !i.management) }))
      .filter(g => g.items.length);
  }

  ngOnInit() {
    this.checkScreenSize();
  }

  @HostListener('window:resize', [])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    
    if (!this.isMobile) {
      // On desktop, reset mobile state
      this.isMobileOpen = false;
    } else {
      // On mobile, ensure sidebar is closed by default
      if (!this.isMobileOpen) {
        this.isMobileOpen = false;
      }
    }
  }

  toggleSidebar() {
    if (this.isMobile) {
      // On mobile: toggle the sidebar visibility
      this.isMobileOpen = !this.isMobileOpen;
      // Close dropdowns when sidebar closes
      if (!this.isMobileOpen) {
        this.activeDropdown = null;
        this.showUserMenu = false;
      }
    } else {
      // On desktop: toggle collapsed state
      this.isCollapsed = !this.isCollapsed;
      if (this.isCollapsed) {
        this.activeDropdown = null;
        this.showUserMenu = false;
      }
    }
  }

  // Method to close sidebar on mobile (when clicking overlay)
  closeSidebar() {
    if (this.isMobile) {
      this.isMobileOpen = false;
      this.activeDropdown = null;
      this.showUserMenu = false;
    }
  }

  toggleDropdown(dropdown: string) {
    if (this.activeDropdown === dropdown) {
      this.activeDropdown = null;
    } else {
      this.activeDropdown = dropdown;
    }
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  logout() {
    AuthService.clearSession();       // token and the cached admin profile
    this.router.navigate(['/login']);
  }

  // Close dropdowns when clicking outside (optional)
  closeDropdowns() {
    this.activeDropdown = null;
    this.showUserMenu = false;
  }
}