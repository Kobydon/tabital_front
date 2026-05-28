// ============================================
// guest.guard.ts - ENHANCED VERSION
// ============================================

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const token = this.authService.getToken();
    
    if (token && !this.isTokenExpired(token)) {
      // User is logged in - redirect to their dashboard
      const storedUser = localStorage.getItem('currentUser');
      
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          this.redirectByRole(user.role);
        } catch (e) {
          this.router.navigate(['/login']);
        }
      } else {
        this.router.navigate(['/login']);
      }
      
      return false;
    }
    
    return true;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp;
      if (!expiry) return false;
      
      const now = Math.floor(Date.now() / 1000);
      return now >= expiry;
    } catch (e) {
      return true;
    }
  }

  private redirectByRole(role: string): void {
    switch (role) {
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'merchant':
        this.router.navigate(['/merchant/dashboard']);
        break;
      case 'customer':
        this.router.navigate(['/customer/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
        break;
    }
  }
}