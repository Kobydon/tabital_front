import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {

    const token = localStorage.getItem('token');

    // ✅ If already logged in → go to dashboard
    if (token) {
      this.router.navigate(['/admin']);
      return false;
    }

    return true;
  }
}