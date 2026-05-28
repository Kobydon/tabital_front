// src/app/auth/forgot-password/forgot-password.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
// import { AuthService } from '../auth.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  step = 1; // 1: email, 2: otp, 3: new password
  isLoading = false;
  error = '';
  success = '';
  resetToken = '';
  userEmail = '';
  
  emailForm: FormGroup;
  otpForm: FormGroup;
  passwordForm: FormGroup;
  
  timer = 60;
  timerInterval: any;
  canResend = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
    
    this.passwordForm = this.fb.group({
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  passwordMatchValidator(group: FormGroup): any {
    const password = group.get('new_password')?.value;
    const confirm = group.get('confirm_password')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  requestOTP(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    
    this.isLoading = true;
    this.error = '';
    this.userEmail = this.emailForm.value.email;
    
    const sub = this.authService.forgotPassword({ email: this.userEmail }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.success = 'success';
        this.step = 2;
        this.startTimer();
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.error?.message || 'Failed to send reset code. Please try again.';
      }
    });
    
    this.subscriptions.push(sub);
  }

  verifyOTP(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }
    
    this.isLoading = true;
    this.error = '';
    
    const sub = this.authService.verifyOTP({
      email: this.userEmail,
      otp: this.otpForm.value.otp
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.resetToken = response.reset_token;
        this.step = 3;
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.error?.error || 'Invalid OTP code. Please try again.';
      }
    });
    
    this.subscriptions.push(sub);
  }

  resetPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    
    this.isLoading = true;
    this.error = '';
    
    const sub = this.authService.resetPassword({
      reset_token: this.resetToken,
      new_password: this.passwordForm.value.new_password
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.success = 'Password reset successful! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.error?.error || 'Failed to reset password. Please try again.';
      }
    });
    
    this.subscriptions.push(sub);
  }

  startTimer(): void {
    this.timer = 60;
    this.canResend = false;
    
    this.timerInterval = setInterval(() => {
      this.timer--;
      if (this.timer <= 0) {
        clearInterval(this.timerInterval);
        this.canResend = true;
      }
    }, 1000);
  }

  resendOTP(): void {
    if (!this.canResend) return;
    
    this.isLoading = true;
    
    const sub = this.authService.forgotPassword({ email: this.userEmail }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.success = 'New OTP sent to your email!';
        this.startTimer();
      },
      error: (error) => {
        this.isLoading = false;
        this.error = 'Failed to resend OTP. Please try again.';
      }
    });
    
    this.subscriptions.push(sub);
  }

  goBack(): void {
    if (this.step > 1) {
      this.step--;
      this.error = '';
      this.success = '';
    } else {
      this.router.navigate(['/login']);
    }
  }

  getFieldError(form: FormGroup, field: string): string {
    const control = form.get(field);
    if (control?.hasError('required')) {
      return `${field.replace('_', ' ')} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('minlength')) {
      return `${field.replace('_', ' ')} must be at least ${control.errors?.['minlength']?.requiredLength} characters`;
    }
    if (field === 'confirm_password' && form.hasError('mismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }
}