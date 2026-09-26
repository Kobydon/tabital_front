// ============================================
// auth.guard.ts - RETURN UrlTree
// ============================================

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const token = this.authService.getToken();
    // Come back here after signing in (e.g. a scanned payment-link QR code)
    const toLogin = () => this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });

    if (!token) {
      console.log('AuthGuard: No token, redirecting to login');
      return toLogin();
    }

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      console.log('AuthGuard: Token expired, redirecting to login');
      this.authService.logout();
      return toLogin();
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
}