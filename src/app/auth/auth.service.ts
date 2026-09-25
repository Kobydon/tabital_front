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
    // Clear the cached profile too, so the next person on this device can't see it
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    sessionStorage.clear();
    this.router.navigate(['/login']);
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