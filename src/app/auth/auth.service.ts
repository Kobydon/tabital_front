import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  API = environment.apiUrl;
  constructor(private http: HttpClient,private router:Router) {}

  register(data: any) {
    return this.http.post(`${this.API}/register`, data);
  }

  login(data: any) {
    return this.http.post(`${this.API}/login`, data);
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  logout() {
    AuthService.clearSession();
    this.router.navigate(['/login']);
  }

  /**
   * Remove everything about the signed-in person from this browser (token, cached profile,
   * any other stored data), so the next person on a shared phone sees nothing. Only the
   * device id used by the fraud checks is kept.
   */
  static clearSession(): void {
    const keep = new Set(['tabital_device_id']);
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && !keep.has(key)) localStorage.removeItem(key);
      }
      sessionStorage.clear();
    } catch { /* storage blocked: nothing stored either */ }
  }


// src/app/auth/auth.service.ts - Add these methods

forgotPassword(data: { email: string }): Observable<any> {
  return this.http.post(`${this.API}/forgot-password`, data);
}

verifyOTP(data: { email: string; otp: string }): Observable<any> {
  return this.http.post(`${this.API}/api/verify-otp`, data);
}
resetPassword(data: { reset_token: string; new_password: string }): Observable<any> {
  return this.http.post(`${this.API}/reset-password`, data);
}

 checkUserExists(email: string, phone: string): Observable<any> {
    return this.http.post(`${this.API}/api/check-user-exists`, {
      business_email: email,
      phone: phone
    });
  }
   
}