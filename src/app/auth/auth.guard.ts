// src/app/auth/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');

    // ✅ Just check if token exists, no role validation
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    // ✅ Token exists, allow access to admin
    return true;
  }
}