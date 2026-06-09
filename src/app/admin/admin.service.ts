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

  private getAuthHeaders(isFormData: boolean = false): HttpHeaders {
    const token = localStorage.getItem(this.TOKEN_KEY);
    let headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
    
    if (!isFormData) {
      headers = headers.set('Content-Type', 'application/json');
    }
    
    return headers;
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
  // DASHBOARD STATS
  // ============================================
  
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.API}/admin/dashboard/stats`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getRecentTransactions(limit: number = 10): Observable<any> {
    return this.http.get(`${this.API}/admin/dashboard/transactions?limit=${limit}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.API}/admin/stats`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
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

  // getMerchantStats(): Observable<any> {
  //   return this.http.get<any>(`${this.API}/admin/merchants/stats`, { headers: this.getAuthHeaders() })
  //     .pipe(catchError(this.handleError.bind(this)));
  // }

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

  // updateTransactionStatus(id: number, data: any): Observable<ApiResponse> {
  //   return this.http.put<ApiResponse>(`${this.API}/transactions/${id}/status`, data, { headers: this.getAuthHeaders() })
  //     .pipe(catchError(this.handleError.bind(this)));
  // }

  // getTransactionStats(): Observable<any> {
  //   return this.http.get<any>(`${this.API}/transactions/stats`, { headers: this.getAuthHeaders() })
  //     .pipe(catchError(this.handleError.bind(this)));
  // }

  deleteTransaction(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.API}/transactions/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }
// Add to AdminService class

// ============================================
// INSTALMENT MANAGEMENT ENDPOINTS
// ============================================

getInstalmentStats(): Observable<any> {
  return this.http.get(`${this.API}/admin/instalments/stats`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

getAllInstalments(filters?: any): Observable<any> {
  let url = `${this.API}/admin/instalments`;
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

getInstalmentDetail(planId: number): Observable<any> {
  return this.http.get(`${this.API}/admin/instalments/${planId}`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

updateInstalmentStatus(planId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/admin/instalments/${planId}/status`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

applyLateFee(paymentId: number): Observable<any> {
  return this.http.post(`${this.API}/admin/instalments/payments/${paymentId}/apply-late-fee`, {}, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

waiveLateFee(paymentId: number, data: any): Observable<any> {
  return this.http.post(`${this.API}/admin/instalments/payments/${paymentId}/waive-late-fee`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

markPaymentAsPaid(paymentId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/admin/instalments/payments/${paymentId}/mark-paid`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

exportInstalments(filters?: any): Observable<Blob> {
  let url = `${this.API}/admin/instalments/export`;
  if (filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { 
    headers: this.getAuthHeaders(), 
    responseType: 'blob' 
  }).pipe(catchError(this.handleError.bind(this)));
}
  // ============================================
  // USER MANAGEMENT (Pending Approvals)
  // ============================================
  
  getPendingUsers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.API}/admin/pending-users`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  approveUser(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API}/admin/approve/${id}`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }
// Add to AdminService class

// ============================================
// COLLECTION MANAGEMENT ENDPOINTS
// ============================================

getCollectionStats(): Observable<any> {
  return this.http.get(`${this.API}/admin/collection/stats`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

getOverduePayments(filters?: any): Observable<any> {
  let url = `${this.API}/admin/collection/overdue`;
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

getOverduePaymentDetail(paymentId: number): Observable<any> {
  return this.http.get(`${this.API}/admin/collection/overdue/${paymentId}`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

sendPaymentReminder(paymentId: number, data: any): Observable<any> {
  return this.http.post(`${this.API}/admin/collection/${paymentId}/reminder`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

markPaymentReceived(paymentId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/admin/collection/${paymentId}/mark-received`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

setPaymentPlan(paymentId: number, data: any): Observable<any> {
  return this.http.post(`${this.API}/admin/collection/${paymentId}/payment-plan`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

exportOverduePayments(filters?: any): Observable<Blob> {
  let url = `${this.API}/admin/collection/export`;
  if (filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { 
    headers: this.getAuthHeaders(), 
    responseType: 'blob' 
  }).pipe(catchError(this.handleError.bind(this)));
}
  rejectUser(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API}/admin/reject/${id}`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }



  // ============================================
  // KYC MANAGEMENT (Merchant & Customer)
  // ============================================
  
  // Merchant KYC
  getPendingKYC(): Observable<any> {
    return this.http.get(`${this.API}/admin/kyc/pending`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getVerifiedKYC(): Observable<any> {
    return this.http.get(`${this.API}/admin/kyc/verified`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getRejectedKYC(): Observable<any> {
    return this.http.get(`${this.API}/admin/kyc/rejected`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getMerchantKYC(merchantId: number): Observable<any> {
    return this.http.get(`${this.API}/admin/kyc/merchant/${merchantId}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  approveMerchantKYC(merchantId: number): Observable<any> {
    return this.http.put(`${this.API}/admin/kyc/approve/${merchantId}`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  rejectMerchantKYC(merchantId: number, rejectionReason: string): Observable<any> {
    return this.http.put(`${this.API}/admin/kyc/reject/${merchantId}`, { rejection_reason: rejectionReason }, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  approveDocument(documentId: number): Observable<any> {
    return this.http.put(`${this.API}/admin/kyc/document/approve/${documentId}`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  rejectDocument(documentId: number, rejectionReason: string): Observable<any> {
    return this.http.put(`${this.API}/admin/kyc/document/reject/${documentId}`, { rejection_reason: rejectionReason }, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Customer KYC
  getPendingCustomerKYC(): Observable<any> {
    return this.http.get(`${this.API}/admin/kyc/customers/pending`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getVerifiedCustomerKYC(): Observable<any> {
    return this.http.get(`${this.API}/admin/kyc/customers/verified`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getRejectedCustomerKYC(): Observable<any> {
    return this.http.get(`${this.API}/admin/kyc/customers/rejected`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getCustomerKYCDetail(customerId: number): Observable<any> {
    return this.http.get(`${this.API}/admin/kyc/customer/${customerId}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  approveCustomerKYC(customerId: number): Observable<any> {
    return this.http.put(`${this.API}/admin/kyc/customer/approve/${customerId}`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  rejectCustomerKYC(customerId: number, rejectionReason: string): Observable<any> {
    return this.http.put(`${this.API}/admin/kyc/customer/reject/${customerId}`, { rejection_reason: rejectionReason }, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  approveCustomerDocument(documentId: number): Observable<any> {
    return this.http.put(`${this.API}/admin/kyc/customer/document/approve/${documentId}`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  rejectCustomerDocument(documentId: number, rejectionReason: string): Observable<any> {
    return this.http.put(`${this.API}/admin/kyc/customer/document/reject/${documentId}`, { rejection_reason: rejectionReason }, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // DOCUMENT MANAGEMENT
  // ============================================

  getMerchantDocuments(merchantId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/admin/merchants/${merchantId}/documents`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  uploadDocument(merchantId: number, documentData: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API}/admin/merchants/${merchantId}/documents/upload`, documentData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  verifyDocument(documentId: number, data: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.API}/admin/documents/${documentId}/verify`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  deleteDocument(documentId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.API}/admin/documents/${documentId}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // ORDERS MANAGEMENT
  // ============================================

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

  approveOrder(orderId: number, data: any): Observable<any> {
    return this.http.put(`${this.API}/admin/orders/${orderId}/approve`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  rejectOrder(orderId: number, data: any): Observable<any> {
    return this.http.put(`${this.API}/admin/orders/${orderId}/reject`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  exportAdminOrders(): Observable<Blob> {
    return this.http.get(`${this.API}/admin/orders/export`, { 
      headers: this.getAuthHeaders(), 
      responseType: 'blob' 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // SETTINGS MANAGEMENT
  // ============================================

  getChargeSettings(): Observable<any> {
    return this.http.get(`${this.API}/admin/settings/charges`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }
// Add to AdminService class

exportCustomers(filters?: any): Observable<Blob> {
  let url = `${this.API}/admin/customers/export`;
  if (filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { 
    headers: this.getAuthHeaders(), 
    responseType: 'blob' 
  }).pipe(catchError(this.handleError.bind(this)));
}
  updateChargeSettings(settings: any): Observable<any> {
    return this.http.put(`${this.API}/admin/settings/charges`, settings, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  updateInstallmentOptions(options: any[]): Observable<any> {
    return this.http.put(`${this.API}/admin/settings/installments`, { options }, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // AUTHENTICATION
  // ============================================
  
  getCurrentUser(): Observable<Merchant> {
    return this.http.get<Merchant>(`${this.API}/admin/get_current_user`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  setAuthToken(token: string): void { 
    localStorage.setItem(this.TOKEN_KEY, token); 
  }
  
  clearAuthToken(): void { 
    localStorage.removeItem(this.TOKEN_KEY); 
  }
  
  isAuthenticated(): boolean { 
    return !!localStorage.getItem(this.TOKEN_KEY); 
  }
  
  getToken(): string | null { 
    return localStorage.getItem(this.TOKEN_KEY); 
  }

  // Add to admin.service.ts

// ============================================
// CUSTOMER MANAGEMENT ENDPOINTS
// ============================================

getCustomerStats(): Observable<any> {
  return this.http.get(`${this.API}/admin/customers/stats`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

getAllCustomers(filters?: any): Observable<any> {
  let url = `${this.API}/admin/customers`;
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

getCustomerDetail(customerId: number): Observable<any> {
  return this.http.get(`${this.API}/admin/customers/${customerId}`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

updateCustomerStatus(customerId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/admin/customers/${customerId}/status`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

updateCustomerCreditLimit(customerId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/admin/customers/${customerId}/credit-limit`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

addCustomerNote(customerId: number, data: any): Observable<any> {
  return this.http.post(`${this.API}/admin/customers/${customerId}/note`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}
// Add to AdminService class

// ============================================
// MERCHANT MANAGEMENT ENDPOINTS
// ============================================

getMerchantStats(): Observable<any> {
  return this.http.get(`${this.API}/admin/merchants/stats`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

getAllMerchants(filters?: any): Observable<any> {
  let url = `${this.API}/admin/merchants`;
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

getMerchantDetail(merchantId: number): Observable<any> {
  return this.http.get(`${this.API}/admin/merchants/${merchantId}`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

updateMerchantStatus(merchantId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/admin/merchants/${merchantId}/status`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// updateMerchantCommission(merchantId: number, data: any): Observable<any> {
//   return this.http.put(`${this.API}/admin/merchants/${merchantId}/commission`, data, { headers: this.getAuthHeaders() })
//     .pipe(catchError(this.handleError.bind(this)));
// }

adjustMerchantReserve(merchantId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/admin/merchants/${merchantId}/reserve`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

exportMerchants(filters?: any): Observable<Blob> {
  let url = `${this.API}/admin/merchants/export`;
  if (filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { 
    headers: this.getAuthHeaders(), 
    responseType: 'blob' 
  }).pipe(catchError(this.handleError.bind(this)));
}
// Add to AdminService class

// ============================================
// TRANSACTION MANAGEMENT ENDPOINTS
// ============================================

getTransactionStats(): Observable<any> {
  return this.http.get(`${this.API}/admin/transactions/stats`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

getAllTransactions(filters?: any): Observable<any> {
  let url = `${this.API}/admin/transactions`;
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

getTransactionDetail(transactionId: number): Observable<any> {
  return this.http.get(`${this.API}/admin/transactions/${transactionId}`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

updateTransactionStatus(transactionId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/admin/transactions/${transactionId}/status`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

updateDeliveryStatus(transactionId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/admin/transactions/${transactionId}/delivery`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

refundTransaction(transactionId: number, data: any): Observable<any> {
  return this.http.post(`${this.API}/admin/transactions/${transactionId}/refund`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

exportTransactions(filters?: any): Observable<Blob> {
  let url = `${this.API}/admin/transactions/export`;
  if (filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { 
    headers: this.getAuthHeaders(), 
    responseType: 'blob' 
  }).pipe(catchError(this.handleError.bind(this)));
}

// Add to AdminService class

// ============================================
// SETTLEMENT MANAGEMENT ENDPOINTS
// ============================================

getSettlementStats(): Observable<any> {
  return this.http.get(`${this.API}/admin/settlements/stats`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

getAllSettlements(filters?: any): Observable<any> {
  let url = `${this.API}/admin/settlements`;
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

getSettlementDetail(settlementId: number): Observable<any> {
  return this.http.get(`${this.API}/admin/settlements/${settlementId}`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

processBulkSettlements(data: any): Observable<any> {
  return this.http.post(`${this.API}/admin/settlements/process-bulk`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

processSingleSettlement(settlementId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/admin/settlements/${settlementId}/process`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

exportSettlements(filters?: any): Observable<Blob> {
  let url = `${this.API}/admin/settlements/export`;
  if (filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { 
    headers: this.getAuthHeaders(), 
    responseType: 'blob' 
  }).pipe(catchError(this.handleError.bind(this)));
}

// Add to AdminService class

// ============================================
// REPORTS & ANALYTICS ENDPOINTS
// ============================================

getRevenueReport(params?: any): Observable<any> {
  let url = `${this.API}/admin/reports/revenue`;
  if (params) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key]) queryParams.append(key, params[key]);
    });
    const qs = queryParams.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

getTransactionReport(params?: any): Observable<any> {
  let url = `${this.API}/admin/reports/transactions`;
  if (params) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key]) queryParams.append(key, params[key]);
    });
    const qs = queryParams.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

getCustomerReport(params?: any): Observable<any> {
  let url = `${this.API}/admin/reports/customers`;
  if (params) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key]) queryParams.append(key, params[key]);
    });
    const qs = queryParams.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

getMerchantReport(params?: any): Observable<any> {
  let url = `${this.API}/admin/reports/merchants`;
  if (params) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key]) queryParams.append(key, params[key]);
    });
    const qs = queryParams.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

getInstalmentReport(params?: any): Observable<any> {
  let url = `${this.API}/admin/reports/instalments`;
  if (params) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key]) queryParams.append(key, params[key]);
    });
    const qs = queryParams.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

getDashboardKPIs(): Observable<any> {
  return this.http.get(`${this.API}/admin/reports/kpis`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

downloadReport(params: any): Observable<Blob> {
  let url = `${this.API}/admin/reports/download`;
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  const qs = queryParams.toString();
  if (qs) url += `?${qs}`;
  
  return this.http.get(url, { 
    headers: this.getAuthHeaders(), 
    responseType: 'blob' 
  }).pipe(catchError(this.handleError.bind(this)));
}

// Add to AdminService class

// ============================================
// PRODUCT PLANS ENDPOINTS
// ============================================

getProductStats(): Observable<any> {
  return this.http.get(`${this.API}/admin/products/stats`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

getAllProducts(filters?: any): Observable<any> {
  let url = `${this.API}/admin/products`;
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

getProductDetail(productId: number): Observable<any> {
  return this.http.get(`${this.API}/admin/products/${productId}`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

updateProductStatus(productId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/admin/products/${productId}/status`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

updateProductFeatured(productId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/admin/products/${productId}/featured`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

updateProductStock(productId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/admin/products/${productId}/stock`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

exportProducts(filters?: any): Observable<Blob> {
  let url = `${this.API}/admin/products/export`;
  if (filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { 
    headers: this.getAuthHeaders(), 
    responseType: 'blob' 
  }).pipe(catchError(this.handleError.bind(this)));
}
// Add to AdminService class

// ============================================
// USER MANAGEMENT ENDPOINTS
// ============================================

getUserStats(): Observable<any> {
  return this.http.get(`${this.API}/admin/users/stats`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

getAllUsers(filters?: any): Observable<any> {
  let url = `${this.API}/admin/users`;
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

getUserDetail(userId: number): Observable<any> {
  return this.http.get(`${this.API}/admin/users/${userId}`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

updateUserStatus(userId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/admin/users/${userId}/status`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

deleteUser(userId: number): Observable<any> {
  return this.http.delete(`${this.API}/admin/users/${userId}`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

exportUsers(filters?: any): Observable<Blob> {
  let url = `${this.API}/admin/users/export`;
  if (filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { 
    headers: this.getAuthHeaders(), 
    responseType: 'blob' 
  }).pipe(catchError(this.handleError.bind(this)));
}
}