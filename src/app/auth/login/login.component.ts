import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { AdminService } from 'src/app/admin/admin.service';
import { MerchantService } from 'src/app/merchant.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  loading = false;
  error = '';

  form = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {}

  // ============================================
  // LOGIN
  // ============================================

  login(): void {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please fill all required fields correctly';
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.login(this.form.value).subscribe({

      next: (res: any) => {

        // ✅ SAVE TOKEN ONLY ONCE
        this.auth.saveToken(res.access_token);

        console.log('LOGIN SUCCESS - TOKEN SAVED');

        // ============================================
        // NOW GET CURRENT USER
        // ============================================

        this.adminService.getCurrentUser().subscribe({

          next: (user: any) => {

            console.log('CURRENT USER:', user);

            this.loading = false;

            // ============================================
            // ROLE ROUTING
            // ============================================

            if (user?.role === 'customer') {
              this.router.navigate(['/customer']);

            } else if (user?.role === 'merchant') {
              this.router.navigate(['/merchant/dashboard']);

            } else if (user?.role === 'admin') {
              this.router.navigate(['/admin/dashboard']);

            } else {
              this.error = 'Unknown user role. Contact support.';
            }
          },

          error: (err) => {

            console.error('GET USER ERROR:', err);

            this.loading = false;

            this.error = 'Failed to load user data';
          }
        });
      },

      error: (err) => {

        this.loading = false;

        console.error('LOGIN ERROR:', err);

        if (err.status === 401) {
          this.error = 'Invalid phone or password';
        } else if (err.status === 404) {
          this.error = 'User not found';
        } else if (err.status === 0) {
          this.error = 'Network error';
        } else {
          this.error = err.error?.message || 'Login failed';
        }

        // clear password
        this.form.patchValue({ password: '' });
      }
    });
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

    if (control?.hasError('pattern')) {
      return 'Invalid phone number format';
    }

    if (control?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }

    return '';
  }
}