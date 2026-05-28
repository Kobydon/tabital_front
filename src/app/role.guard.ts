// ============================================
// role.guard.ts - FIXED (No navigation during guard)
// ============================================

import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';

import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { AuthService } from './auth/auth.service';
import { AdminService } from './admin/admin.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private router: Router,
    private authService: AuthService,
    private adminService: AdminService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    const expectedRole = route.data['role'];
    
    console.log('🔒 RoleGuard - Expected Role:', expectedRole);
    console.log('🔒 RoleGuard - Current URL:', this.router.url);

    // CHECK TOKEN FIRST
    const token = this.authService.getToken();
    if (!token) {
      console.log('❌ No token found');
      return this.router.parseUrl('/login');
    }

    // CHECK LOCAL USER
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedUser) {
      try {
        const currentUser = JSON.parse(storedUser);
        console.log('📦 Stored User Role:', currentUser?.role);
        
        // Check if user is approved
        if (currentUser?.status === 'suspended' || currentUser?.status === 'banned') {
          console.log('❌ User is suspended/banned');
          this.authService.logout();
          return this.router.parseUrl('/login');
        }
        
        // ROLE MATCH
        if (currentUser?.role === expectedRole) {
          console.log('✅✅✅ Role matches! Access GRANTED ✅✅✅');
          return true;
        } else {
          console.log(`❌ Role mismatch! Expected: ${expectedRole}, Got: ${currentUser?.role}`);
          // IMPORTANT: Return UrlTree instead of calling navigate directly
          return this.getRedirectUrl(currentUser?.role);
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }

    // FETCH FROM API IF NO STORED USER
    console.log('🔄 No stored user, fetching from API...');
    return this.adminService.getCurrentUser().pipe(
      tap((user: any) => {
        if (user && user.role) {
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
      }),
      map((user: any) => {
        if (user?.role === expectedRole) {
          return true;
        }
        return this.getRedirectUrl(user?.role);
      }),
      catchError((err) => {
        console.error('❌ Error fetching user:', err);
        this.authService.logout();
        return of(this.router.parseUrl('/login'));
      })
    );
  }

  // ============================================
  // GET REDIRECT URL (returns UrlTree instead of navigating)
  // ============================================

  private getRedirectUrl(role: string): UrlTree {
    console.log('🔄 Getting redirect URL for role:', role);
    
    switch (role) {
      case 'admin':
        return this.router.parseUrl('/admin/dashboard');
      case 'merchant':
        return this.router.parseUrl('/merchant/dashboard');
      case 'customer':
        return this.router.parseUrl('/customer/dashboard');
      default:
        this.authService.logout();
        return this.router.parseUrl('/login');
    }
  }
}