import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { AdminService } from './admin/admin.service';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService,
    private adminService: AdminService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> | boolean {
    const expectedRole = route.data['role'];
    
    // Check if user is already stored in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const currentUser = JSON.parse(storedUser);
      if (currentUser && currentUser.role === expectedRole) {
        return true;
      }
      
      // Redirect based on role
      if (currentUser?.role === 'admin') {
        this.router.navigate(['/admin']);
      } else if (currentUser?.role === 'merchant') {
        this.router.navigate(['/merchant']);
      } else {
        this.router.navigate(['/login']);
      }
      return false;
    }
    
    // Fetch current user from API if not stored
    return this.adminService.getCurrentUser().pipe(
      map((user: any) => {
        if (user && user.role === expectedRole) {
          // Store user in localStorage
          localStorage.setItem('currentUser', JSON.stringify(user));
          return true;
        }
        
        // Redirect based on role
        if (user?.role === 'admin') {
          this.router.navigate(['/admin']);
        } else if (user?.role === 'merchant') {
          this.router.navigate(['/merchant']);
        } else {
          this.router.navigate(['/login']);
        }
        return false;
      })
    );
  }
}