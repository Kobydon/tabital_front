import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {
    this.checkScreenSize();
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
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  // Close dropdowns when clicking outside (optional)
  closeDropdowns() {
    this.activeDropdown = null;
    this.showUserMenu = false;
  }
}