// ============================================
// login.component.ts - WITH PASSWORD VISIBILITY TOGGLE
// ============================================

import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../auth.service';
import { AdminService } from 'src/app/admin/admin.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy {

  loading = false;
  error = '';
  showPassword = false; // Add password visibility toggle
  private isNavigating = false;
  private subscriptions: Subscription[] = [];

  form = this.fb.group({
    phone: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ============================================
  // TOGGLE PASSWORD VISIBILITY
  // ============================================

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // ============================================
  // LOGIN
  // ============================================

  login(): void {
    // Prevent multiple login attempts
    if (this.loading || this.isNavigating) {
      console.log('Login or navigation already in progress');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please fill all required fields correctly';
      return;
    }

    this.loading = true;
    this.error = '';

    const loginSub = this.auth.login(this.form.value).subscribe({
      next: (res: any) => {
        console.log('✅ Login successful:', res);
        
        if (res.access_token) {
          this.auth.saveToken(res.access_token);
          console.log('💾 Token saved');
        } else {
          console.error('No access_token in response');
          this.error = 'Invalid server response';
          this.loading = false;
          return;
        }

        const userSub = this.adminService.getCurrentUser().subscribe({
          next: (user: any) => {
            console.log('👤 User data received:', user);
            
            this.loading = false;

            if (user?.status && user.status !== 'approved' && user.status !== 'active') {
              this.error = `Your account is ${user.status}. Please contact support.`;
              this.auth.logout();
              return;
            }

            // Save user to localStorage
            const userToStore = {
              id: user.id,
              role: user.role,
              status: user.status,
              merchant_id: user.merchant_id,
              business_name: user.business_name,
              owner_name: user.owner_name,
              phone: user.phone,
              ...user
            };
            
            localStorage.setItem('currentUser', JSON.stringify(userToStore));
            console.log('💾 User saved to localStorage');

            // IMPORTANT: Use setTimeout to ensure we're outside the current change detection
            setTimeout(() => {
              this.navigateByRole(user?.role);
            }, 100);
          },
          error: (err) => {
            console.error('❌ either username or password is wrong. Please try again.', err);
            this.loading = false;
            this.error = 'either username or password is wrong. Please try again.';
            this.auth.logout();
          }
    });
        
        this.subscriptions.push(userSub);
      },
      error: (err) => {
        console.error('❌ Login error:', err);
        this.loading = false;

        if (err.status === 401) {
          this.error = 'Invalid phone or password';
        } else if (err.status === 404) {
          this.error = 'User not found';
        } else if (err.status === 0) {
          this.error = 'Network error. Check your connection.';
        } else {
          this.error = err.error?.message || 'Login failed. Please try again.';
        }

        this.form.patchValue({ password: '' });
      }
    });
    
    this.subscriptions.push(loginSub);
  }

  // ============================================
  // NAVIGATE BY ROLE WITH PREVENTION
  // ============================================

  private navigateByRole(role: string): void {
    // Prevent multiple navigation calls
    if (this.isNavigating) {
      console.log('Navigation already in progress, skipping...');
      return;
    }
    
    this.isNavigating = true;
    console.log('➡️ Starting navigation for role:', role);
    
    let navigationPromise: Promise<boolean>;
    
    switch (role) {
      case 'admin':
        navigationPromise = this.router.navigate(['/admin/dashboard']);
        break;
      case 'merchant':
        navigationPromise = this.router.navigate(['/merchant/dashboard']);
        break;
      case 'customer':
        navigationPromise = this.router.navigate(['/customer/dashboard']);
        break;
      default:
        console.error('Unknown role:', role);
        this.error = 'Unknown user role';
        this.auth.logout();
        this.isNavigating = false;
        return;
    }
    
    navigationPromise.then(
      (success) => {
        console.log('Navigation result:', success);
        if (!success) {
          console.error('Navigation failed');
          this.error = 'Navigation failed. Please try again.';
          this.isNavigating = false;
        }
      },
      (error) => {
        console.error('Navigation error:', error);
        this.error = 'Navigation error occurred.';
        this.isNavigating = false;
      }
    );
  }

  // ============================================
  // FORM HELPERS
  // ============================================

  hasError(field: string, error: string): boolean {
    const control = this.form.get(field);
    return !!(control?.hasError(error) && (control.dirty || control.touched));
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (control?.hasError('required')) {
      return `${field} is required`;
    }
    if (control?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }
}