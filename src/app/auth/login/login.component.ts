import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

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
    private router: Router
  ) {}

  login() {
    // Check if form is invalid
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      
      // Set specific error messages based on validation
      if (this.form.get('phone')?.hasError('required')) {
        this.error = 'Phone number is required';
      } else if (this.form.get('phone')?.hasError('pattern')) {
        this.error = 'Please enter a valid phone number (10-15 digits)';
      } else if (this.form.get('password')?.hasError('required')) {
        this.error = 'Password is required';
      } else if (this.form.get('password')?.hasError('minlength')) {
        this.error = 'Password must be at least 6 characters';
      } else {
        this.error = 'Please fill in all fields correctly';
      }
      return;
    }

    // Start loading
    this.loading = true;
    this.error = '';

    // Call login API
    this.auth.login(this.form.value).subscribe({
      next: (res: any) => {
        this.auth.saveToken(res.access_token);
        this.loading = false;
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        // Handle different error scenarios
        if (err.status === 401) {
          this.error = 'Invalid phone number or password';
        } else if (err.status === 404) {
          this.error = 'User not found. Please sign up first';
        } else if (err.status === 0) {
          this.error = 'Network error. Please check your connection';
        } else {
          this.error = err.error?.message || err.error || 'Login failed. Please try again';
        }
        
        this.loading = false;
        
        // Clear password field on authentication error
        if (err.status === 401 || err.status === 404) {
          this.form.patchValue({ password: '' });
          this.form.get('password')?.reset();
        }
      }
    });
  }

  // Helper method to check if field has error (optional - for inline validation)
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.form.get(fieldName);
    return field?.hasError(errorType) && (field?.touched || field?.dirty) || false;
  }

  // Helper method to get error message for specific field (optional)
  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    
    if (field?.hasError('required')) {
      return `${fieldName === 'phone' ? 'Phone number' : 'Password'} is required`;
    }
    
    if (field?.hasError('pattern')) {
      return 'Please enter a valid phone number (10-15 digits)';
    }
    
    if (field?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    
    return '';
  }
}