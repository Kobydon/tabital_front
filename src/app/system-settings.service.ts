// system-settings.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SystemSettings {
  platformName: string;
  defaultCurrency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
  maintenanceMode: boolean;
  merchantFeePercentage: number;
  lateFeePercentage: number;
  serviceFee: number;
  lateFeeGracePeriodDays: number;
  apiRateLimit: number;
  apiRateLimitWindow: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  twoFactorRequired: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  minimumPayoutAmount: number;
  payoutSchedule: string;
  autoPayoutEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SystemSettingsService {
  private apiUrl = '/api/system-settings';
  
  constructor(private http: HttpClient) {}
  
  getSettings(): Observable<SystemSettings> {
    return this.http.get<SystemSettings>(this.apiUrl);
  }
  
  updateSettings(settings: SystemSettings): Observable<any> {
    return this.http.put(this.apiUrl, settings);
  }
  
  getInstallmentOptions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/installment-options`);
  }
  
  updateInstallmentOptions(options: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/installment-options`, options);
  }
  
  testConnection(): Observable<any> {
    return this.http.get(`${this.apiUrl}/test-connection`);
  }
  
  manualBackup(): Observable<any> {
    return this.http.post(`${this.apiUrl}/backup`, {});
  }
  
  exportSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/export`);
  }
}