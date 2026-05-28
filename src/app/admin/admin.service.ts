import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

export interface Customer {
  id: number;
  customer_id?: string;
  phone: string;
  role: string;
  business_name: string | null;
  full_name: string | null;
  national_id: string | null;
  city: string | null;
  income_range: string | null;
  status: string;
  created_at: string;
  payment_plan: string | null;
  ref_name: string | null;
  ref_phone: string | null;
  ref_relationship: string | null;
  gps: string | null;
  address: string | null;
  agree: boolean;
}

export interface Merchant {
  id: number;
  merchant_id?: string;
  phone: string;
  role: string;
  business_name: string | null;
  owner_name?: string | null;
  full_name: string | null;
  national_id: string | null;
  city: string | null;
  income_range: string | null;
  status: string;
  created_at: string;
  payment_plan: string | null;
  business_type: string | null;
  registration_number: string | null;
  tax_id: string | null;
  business_address: string | null;
  business_phone: string | null;
  business_email: string | null;
  website: string | null;
  description: string | null;
  total_products: number;
  total_sales: number;
  rating: number;
  verified: boolean;
  address: string | null;
  gps: string | null;
  agree: boolean;
  kyc_status?: string;
  verification_level?: string;
  aml_screening?: string;
  commission_rate?: number;
  pending_payout?: number;
  next_settlement?: string;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
}

export interface Transaction {
  id: number;
  transaction_id: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  merchant_id: number;
  merchant_name: string;
  merchant_phone: string;
  amount: number;
  product_name: string;
  product_description: string;
  quantity: number;
  payment_method: string;
  payment_status: string;
  payment_reference: string;
  payment_plan?: string;
  status: string;
  transaction_date: string;
  completion_date: string;
  delivery_address: string;
  delivery_status: string;
  tracking_number: string;
  notes: string;
  created_at: string;
}

export interface ApiResponse {
  message: string;
  data?: any;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private API = 'https://tabital.onrender.com';
  private readonly TOKEN_KEY = 'access_token';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API Error:', error);
    let errorMessage = 'An unexpected error occurred';
    if (error.status === 401) {
      errorMessage = 'Session expired. Please login again.';
      localStorage.removeItem(this.TOKEN_KEY);
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      errorMessage = 'Resource not found.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    return throwError(() => new Error(errorMessage));
  }

  // ============================================
  // CUSTOMER ENDPOINTS
  // ============================================
  
  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.API}/admin/customers`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getCustomer(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.API}/admin/customers/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  updateCustomer(id: number, data: Partial<Customer>): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.API}/admin/customers/${id}`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  deleteCustomer(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.API}/admin/customers/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // MERCHANT ENDPOINTS
  // ============================================
  
  getMerchants(): Observable<Merchant[]> {
    return this.http.get<Merchant[]>(`${this.API}/admin/merchants`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getMerchant(id: number): Observable<Merchant> {
    return this.http.get<Merchant>(`${this.API}/admin/merchants/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  updateMerchant(id: number, data: Partial<Merchant>): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.API}/admin/merchants/${id}`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  deleteMerchant(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.API}/admin/merchants/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  verifyMerchant(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API}/admin/merchants/verify/${id}`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  updateMerchantKYC(id: number, data: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.API}/admin/merchants/${id}/kyc`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  updateMerchantCommission(id: number, data: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.API}/admin/merchants/${id}/commission`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  updateMerchantSettlement(id: number, data: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.API}/admin/merchants/${id}/settlement`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getMerchantStats(): Observable<any> {
    return this.http.get<any>(`${this.API}/admin/merchants/stats`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // TRANSACTION ENDPOINTS
  // ============================================
  
  getTransactions(filters?: any): Observable<Transaction[]> {
    let url = `${this.API}/transactions`;
    if (filters) {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }
    return this.http.get<Transaction[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  createTransaction(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API}/transactions/create`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  updateTransactionStatus(id: number, data: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.API}/transactions/${id}/status`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getTransactionStats(): Observable<any> {
    return this.http.get<any>(`${this.API}/transactions/stats`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  deleteTransaction(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.API}/transactions/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // COMMON ENDPOINTS
  // ============================================
  
  getPendingUsers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.API}/admin/pending-users`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  
  approveUser(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API}/admin/approve/${id}`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  rejectUser(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API}/admin/reject/${id}`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.API}/admin/stats`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // AUTHENTICATION
  // ============================================
  
  setAuthToken(token: string): void { localStorage.setItem(this.TOKEN_KEY, token); }
  clearAuthToken(): void { localStorage.removeItem(this.TOKEN_KEY); }
  isAuthenticated(): boolean { return !!localStorage.getItem(this.TOKEN_KEY); }
  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }


  // Add to AdminService class

// ============================================
// DOCUMENT ENDPOINTS
// ============================================

getMerchantDocuments(merchantId: number): Observable<any[]> {
  const headers = this.getAuthHeaders();
  return this.http.get<any[]>(`${this.API}/admin/merchants/${merchantId}/documents`, { headers })
    .pipe(catchError(this.handleError.bind(this)));
}

uploadDocument(merchantId: number, documentData: any): Observable<ApiResponse> {
  const headers = this.getAuthHeaders();
  return this.http.post<ApiResponse>(`${this.API}/admin/merchants/${merchantId}/documents/upload`, documentData, { headers })
    .pipe(catchError(this.handleError.bind(this)));
}

verifyDocument(documentId: number, data: any): Observable<ApiResponse> {
  const headers = this.getAuthHeaders();
  return this.http.put<ApiResponse>(`${this.API}/admin/documents/${documentId}/verify`, data, { headers })
    .pipe(catchError(this.handleError.bind(this)));
}

deleteDocument(documentId: number): Observable<ApiResponse> {
  const headers = this.getAuthHeaders();
  return this.http.delete<ApiResponse>(`${this.API}/admin/documents/${documentId}`, { headers })
    .pipe(catchError(this.handleError.bind(this)));
}


getCurrentUser(): Observable<Merchant> {
  return this.http.get<Merchant>(
    `${this.API}/admin/get_current_user`,
    {
      headers: this.getAuthHeaders()
    }
  ).pipe(
    catchError(this.handleError.bind(this))
  );
}
// admin.service.ts - Add these methods

// Get charge settings

// Update installment options
updateInstallmentOptions(options: any[]): Observable<any> {
  return this.http.put(`${this.API}/admin/settings/installments`, { options }, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// admin.service.ts - Add these methods

// Get charge settings
getChargeSettings(): Observable<any> {
  return this.http.get(`${this.API}/admin/settings/charges`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Update charge settings
updateChargeSettings(settings: any): Observable<any> {
  return this.http.put(`${this.API}/admin/settings/charges`, settings, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// admin.service.ts - Add these methods

// Get admin orders
getAdminOrders(filters?: any): Observable<any> {
  let url = `${this.API}/admin/orders`;
  if (filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Approve order
approveOrder(orderId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/admin/orders/${orderId}/approve`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Reject order
rejectOrder(orderId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/admin/orders/${orderId}/reject`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Export admin orders
exportAdminOrders(): Observable<Blob> {
  return this.http.get(`${this.API}/admin/orders/export`, { 
    headers: this.getAuthHeaders(), 
    responseType: 'blob' 
  }).pipe(catchError(this.handleError.bind(this)));
}
getPendingKYC(): Observable<any> {
    return this.http.get(`${this.API}/admin/kyc/pending`, { headers: this.getAuthHeaders() });
  }

  getVerifiedKYC(): Observable<any> {
    return this.http.get(`${this.API}/admin/kyc/verified`, { headers: this.getAuthHeaders() });
  }

  getRejectedKYC(): Observable<any> {
    return this.http.get(`${this.API}/admin/kyc/rejected`, { headers: this.getAuthHeaders() });
  }

  getMerchantKYC(merchantId: number): Observable<any> {
    return this.http.get(`${this.API}/admin/kyc/merchant/${merchantId}`, { headers: this.getAuthHeaders() });
  }

  approveMerchantKYC(merchantId: number): Observable<any> {
    return this.http.put(`${this.API}/admin/kyc/approve/${merchantId}`, {}, { headers: this.getAuthHeaders() });
  }

  rejectMerchantKYC(merchantId: number, rejectionReason: string): Observable<any> {
    return this.http.put(`${this.API}/admin/kyc/reject/${merchantId}`, { rejection_reason: rejectionReason }, { headers: this.getAuthHeaders() });
  }

  approveDocument(documentId: number): Observable<any> {
    return this.http.put(`${this.API}/admin/kyc/document/approve/${documentId}`, {}, { headers: this.getAuthHeaders() });
  }

  rejectDocument(documentId: number, rejectionReason: string): Observable<any> {
    return this.http.put(`${this.API}/admin/kyc/document/reject/${documentId}`, { rejection_reason: rejectionReason }, { headers: this.getAuthHeaders() });
  }



}


