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
  business_reg_number: string | null;
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

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private API = 'http://127.0.0.1:5000';
  // private API = 'https://tabital.onrender.com';
  
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
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to server. Please check if the backend is running.';
    } else if (error.status === 401) {
      errorMessage = 'Session expired. Please login again.';
      localStorage.removeItem(this.TOKEN_KEY);
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      errorMessage = 'Resource not found.';
    } else if (error.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // ============================================
  // CUSTOMER ENDPOINTS
  // ============================================
  
  getCustomers(): Observable<Customer[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Customer[]>(`${this.API}/admin/customers`, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getCustomer(id: number): Observable<Customer> {
    const headers = this.getAuthHeaders();
    return this.http.get<Customer>(`${this.API}/admin/customers/${id}`, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  updateCustomer(id: number, customerData: Partial<Customer>): Observable<ApiResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<ApiResponse>(`${this.API}/admin/customers/${id}`, customerData, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  deleteCustomer(id: number): Observable<ApiResponse> {
    const headers = this.getAuthHeaders();
    return this.http.delete<ApiResponse>(`${this.API}/admin/customers/${id}`, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // MERCHANT ENDPOINTS
  // ============================================
  
  getMerchants(): Observable<Merchant[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Merchant[]>(`${this.API}/admin/merchants`, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getMerchant(id: number): Observable<Merchant> {
    const headers = this.getAuthHeaders();
    return this.http.get<Merchant>(`${this.API}/admin/merchants/${id}`, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  updateMerchant(id: number, merchantData: Partial<Merchant>): Observable<ApiResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<ApiResponse>(`${this.API}/admin/merchants/${id}`, merchantData, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  deleteMerchant(id: number): Observable<ApiResponse> {
    const headers = this.getAuthHeaders();
    return this.http.delete<ApiResponse>(`${this.API}/admin/merchants/${id}`, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  verifyMerchant(id: number): Observable<ApiResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<ApiResponse>(`${this.API}/admin/merchants/verify/${id}`, {}, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getMerchantStats(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.API}/admin/merchants/stats`, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // TRANSACTION ENDPOINTS
  // ============================================
  
  /**
   * Get all transactions with optional filters
   * @param filters - Optional filters (status, payment_status, start_date, end_date, search, type)
   */
  getTransactions(filters?: any): Observable<Transaction[]> {
    let url = `${this.API}/transactions`;
    if (filters) {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    const headers = this.getAuthHeaders();
    return this.http.get<Transaction[]>(url, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Create a new transaction
   * @param transactionData - Transaction data (merchant_id, product_name, amount, etc.)
   */
  createTransaction(transactionData: any): Observable<ApiResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<ApiResponse>(`${this.API}/transactions/create`, transactionData, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Update transaction status
   * @param transactionId - Transaction ID
   * @param data - Update data (status, payment_status, delivery_status, etc.)
   */
  updateTransactionStatus(transactionId: number, data: any): Observable<ApiResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<ApiResponse>(`${this.API}/transactions/${transactionId}/status`, data, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Get transaction statistics
   */
  getTransactionStats(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.API}/transactions/stats`, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Delete a transaction (Admin only)
   * @param transactionId - Transaction ID
   */
  deleteTransaction(transactionId: number): Observable<ApiResponse> {
    const headers = this.getAuthHeaders();
    return this.http.delete<ApiResponse>(`${this.API}/transactions/${transactionId}`, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // COMMON ENDPOINTS
  // ============================================
  
  getPendingUsers(): Observable<Customer[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Customer[]>(`${this.API}/admin/pending-users`, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  approveUser(id: number): Observable<ApiResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<ApiResponse>(`${this.API}/admin/approve/${id}`, {}, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  rejectUser(id: number): Observable<ApiResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<ApiResponse>(`${this.API}/admin/reject/${id}`, {}, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getStats(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.API}/admin/stats`, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // AUTHENTICATION METHODS
  // ============================================
  
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
}