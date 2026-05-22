// src/app/services/customer.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface CustomerProfile {
  id: number;
  customer_id: string;
  full_name: string;
  email: string;
  phone: string;
  business_name?: string;
  city?: string;
  address?: string;
  gps?: string;
  status: string;
  kyc_status: string;
  income_range?: string;
  created_at: string;
  total_spent?: number;
  active_plans_count?: number;
}

// src/app/customers.service.ts (update the DashboardStats interface)
export interface DashboardStats {
  total_outstanding: number;
  total_outstanding_plans_count: number;
  next_payment_amount: number;
  next_payment_date: string;
  next_payment_plan_name: string;
  paid_to_date: number;
  paid_to_date_period: string;
  active_plans_count: number;
  account_status: string;
  account_status_message: string;
  customer_name?: string;  // Add this property
  customer_id?: string;     // Add this if needed
  email?: string;           // Add this if needed
  phone?: string;           // Add this if needed
}
export interface InstalmentPlan {
  id: number;
  plan_id: string;
  transaction_id: string;
  product_name: string;
  product_description: string;
  merchant_name: string;
  merchant_phone: string;
  total_amount: number;
  amount_paid: number;
  amount_outstanding: number;
  instalment_term: number;
  instalment_frequency: string;
  instalment_amount: number;
  next_payment_date: string;
  next_payment_amount: number;
  due_date: string;
  status: 'active' | 'completed' | 'overdue' | 'defaulted';
  created_at: string;
  completed_at?: string;
  payment_schedule?: PaymentSchedule[];
}

export interface PaymentSchedule {
  id: number;
  instalment_number: number;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paid_date?: string;
  payment_reference?: string;
}

export interface Payment {
  id: number;
  payment_id: string;
  transaction_id: string;
  plan_id: string;
  amount: number;
  payment_method: string;
  payment_reference: string;
  status: string;
  payment_date: string;
  instalment_number?: number;
}

export interface Transaction {
  id: number;
  transaction_id: string;
  merchant_name: string;
  product_name: string;
  product_description: string;
  amount: number;
  payment_method: string;
  payment_plan: string;
  status: string;
  transaction_date: string;
  delivery_status?: string;
  tracking_number?: string; // Add this field for tracking number
  notes?: string;           // Add this field for any additional notes
  merchant_phone?: string;     // Add this if needed
  payment_reference?: string;     // Add this if neededq  
  payment_status: string;     // Add this if needed
  delivery_address?: string;     // Add this if needed
}

export interface DashboardStats {
  total_outstanding: number;
  total_outstanding_plans_count: number;
  next_payment_amount: number;
  next_payment_date: string;
  next_payment_plan_name: string;
  paid_to_date: number;
  paid_to_date_period: string;
  active_plans_count: number;
  account_status: string;
  account_status_message: string;
}

export interface PaymentOverview {
  monthly_data: Array<{
    month: string;
    paid: number;
    outstanding: number;
  }>;
  total_paid: number;
  total_outstanding: number;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private API = 'http://127.0.0.1:5000';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
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
      localStorage.removeItem('access_token');
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
  // DASHBOARD ENDPOINTS
  // ============================================

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.API}/customer/dashboard/stats`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getPaymentOverview(): Observable<PaymentOverview> {
    return this.http.get<PaymentOverview>(`${this.API}/customer/payment-overview`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getUpcomingPayments(limit: number = 5): Observable<InstalmentPlan[]> {
    return this.http.get<InstalmentPlan[]>(`${this.API}/customer/upcoming-payments?limit=${limit}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getRecentTransactions(limit: number = 5): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.API}/customer/recent-transactions?limit=${limit}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // INSTALMENT PLANS ENDPOINTS
  // ============================================

  // customers.service.ts - Update getMyPlans to return payment schedule

// customers.service.ts - make sure getMyPlans returns the data correctly

getMyPlans(filters?: any): Observable<any> {
  let url = `${this.API}/customer/instalments`;
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

  getPlanDetails(planId: number): Observable<InstalmentPlan> {
    return this.http.get<InstalmentPlan>(`${this.API}/customer/instalments/${planId}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getPlanPaymentSchedule(planId: number): Observable<PaymentSchedule[]> {
    return this.http.get<PaymentSchedule[]>(`${this.API}/customer/instalments/${planId}/schedule`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // PAYMENTS ENDPOINTS
  // ============================================
// Update the getPaymentHistory method to use the new endpoint
getPaymentHistory(filters?: any): Observable<any> {
  let url = `${this.API}/customer/payments`;
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

// Add method to get payment stats
getPaymentStats(): Observable<any> {
  return this.http.get(`${this.API}/customer/payments/stats`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Add method to download receipt

// customers.service.ts
makeOnePayment(paymentData: any): Observable<any> {
  return this.http.post(`${this.API}/customer/payments/make`, paymentData, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Add these methods to customers.service.ts

// Get paid instalment payments
getPaidInstalmentPayments(filters?: any): Observable<any> {
  let url = `${this.API}/customer/paid-payments`;
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

// Export paid instalment payments
exportPaidInstalmentPayments(filters?: any): Observable<Blob> {
  let url = `${this.API}/customer/paid-payments/export`;
  if (filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { headers: this.getAuthHeaders(), responseType: 'blob' })
    .pipe(catchError(this.handleError.bind(this)));
}

// In customers.service.ts - ensure the method signature is correct

downloadCustomerReceipt(planId: number, installmentNumber: number): Observable<Blob> {
  return this.http.get(`${this.API}/customer/instalments/${planId}/receipt/${installmentNumber}`, { 
    headers: this.getAuthHeaders(), 
    responseType: 'blob' 
  }).pipe(catchError(this.handleError.bind(this)));
}

getPlanOneDetails(planId: number): Observable<any> {
  return this.http.get(`${this.API}/customer/instalments/${planId}`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}
  makePayment(data: { plan_id: number; amount: number; payment_method: string }): Observable<any> {
    return this.http.post(`${this.API}/customer/payments/make`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getPaymentMethods(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/customer/payment-methods`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // TRANSACTIONS ENDPOINTS
  // ============================================

// Update in customers.service.ts

getMyTransactions(filters?: any): Observable<{ transactions: Transaction[]; total: number; page: number; limit: number; total_pages: number }> {
  let url = `${this.API}/customer/transactions`;
  if (filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get<{ transactions: Transaction[]; total: number; page: number; limit: number; total_pages: number }>(url, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

getTransactionStats(): Observable<any> {
  return this.http.get(`${this.API}/customer/transactions/stats`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

exportTransactions(filters?: any): Observable<Blob> {
  let url = `${this.API}/customer/transactions/export`;
  if (filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { headers: this.getAuthHeaders(), responseType: 'blob' })
    .pipe(catchError(this.handleError.bind(this)));
}

  getTransactionDetails(transactionId: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.API}/customer/transactions/${transactionId}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // PROFILE ENDPOINTS
  // ============================================

  getProfile(): Observable<CustomerProfile> {
    return this.http.get<CustomerProfile>(`${this.API}/customer/profile`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  updateProfile(data: Partial<CustomerProfile>): Observable<any> {
    return this.http.put(`${this.API}/customer/profile`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  updatePassword(data: { current_password: string; new_password: string }): Observable<any> {
    return this.http.put(`${this.API}/customer/password`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  uploadKycDocument(file: File, documentType: string): Observable<any> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('document_type', documentType);
    return this.http.post(`${this.API}/customer/kyc/upload`, formData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getKycCustomerStatus(): Observable<any> {
    return this.http.get(`${this.API}/customer/kyc/status`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // STATEMENTS & REPORTS
  // ============================================

  downloadStatement(params: { start_date: string; end_date: string; format: 'pdf' | 'csv' }): Observable<Blob> {
    let url = `${this.API}/customer/statement/download`;
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params]) {
        queryParams.append(key, params[key as keyof typeof params] as string);
      }
    });
    const qs = queryParams.toString();
    if (qs) url += `?${qs}`;
    
    return this.http.get(url, { 
      headers: this.getAuthHeaders(), 
      responseType: 'blob' 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // SUPPORT
  // ============================================

  contactSupport(data: { subject: string; message: string; attachment?: File }): Observable<any> {
    const formData = new FormData();
    formData.append('subject', data.subject);
    formData.append('message', data.message);
    if (data.attachment) {
      formData.append('attachment', data.attachment);
    }
    return this.http.post(`${this.API}/customer/support/ticket`, formData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getSupportTickets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/customer/support/tickets`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  getNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/customer/notifications`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  markNotificationRead(notificationId: number): Observable<any> {
    return this.http.put(`${this.API}/customer/notifications/${notificationId}/read`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getNotificationSettings(): Observable<any> {
    return this.http.get(`${this.API}/customer/notifications/settings`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  updateNotificationSettings(settings: any): Observable<any> {
    return this.http.put(`${this.API}/customer/notifications/settings`, settings, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ============================================
  // AVAILABLE PRODUCTS (for new purchases)
  // ============================================

  getAvailableProducts(filters?: any): Observable<any[]> {
    let url = `${this.API}/customer/products`;
    if (filters) {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }
    return this.http.get<any[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  applyForInstalment(data: { product_id: number; term: number; down_payment?: number }): Observable<any> {
    return this.http.post(`${this.API}/customer/instalments/apply`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Add to your CustomerService
requestPaymentReminder(): Observable<any> {
  return this.http.post(`${this.API}/customer/payments/reminder`, {}, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Add to customers.service.ts

// Update transaction status
updateTransactionStatus(transactionId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/merchant/transactions/${transactionId}/status`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Refund transaction
refundTransaction(transactionId: number, data: any): Observable<any> {
  return this.http.post(`${this.API}/merchant/transactions/${transactionId}/refund`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Export transactions
exportCustomerTransactions(filters: any): Observable<Blob> {
  let url = `${this.API}/merchant/transactions/export`;
  if (filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { headers: this.getAuthHeaders(), responseType: 'blob' })
    .pipe(catchError(this.handleError.bind(this)));
}

// Add to customers.service.ts

// Activity Log
getActivityLog(): Observable<any> {
  return this.http.get(`${this.API}/customer/settings/activity-log`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// KYC Status
getKycStatus(): Observable<any> {
  return this.http.get(`${this.API}/customer/kyc/status`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Upload KYC Document
uploadCustomerKycDocument(file: File, documentType: string): Observable<any> {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('document_type', documentType);
  return this.http.post(`${this.API}/customer/kyc/upload`, formData, { 
    headers: this.getAuthHeaders() 
  }).pipe(catchError(this.handleError.bind(this)));
}

// Update Password
updateCustomerPassword(data: { current_password: string; new_password: string }): Observable<any> {
  return this.http.put(`${this.API}/customer/password`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}
// Add to customers.service.ts

// Get notification settings
getCustomerNotificationSettings(): Observable<any> {
  return this.http.get(`${this.API}/customer/notifications/settings`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Update notification settings
updateCustomerNotificationSettings(settings: any): Observable<any> {
  return this.http.put(`${this.API}/customer/notifications/settings`, settings, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Get preferences
getCustomerPreferences(): Observable<any> {
  return this.http.get(`${this.API}/customer/settings/preferences`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Update preferences
updateCustomerPreferences(preferences: any): Observable<any> {
  return this.http.put(`${this.API}/customer/settings/preferences`, preferences, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Add to customers.service.ts

// getCustomerNotifications(): Observable<any> {
//   return this.http.get(`${this.API}/customer/notifications`, { headers: this.getAuthHeaders() })
//     .pipe(catchError(this.handleError.bind(this)));
// }

// customers.service.ts - Add these methods

// Get unread notification count
getUnreadNotificationCount(): Observable<any> {
  return this.http.get(`${this.API}/notifications/unread-count`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Get customer notifications (with pagination and filters)
// getCustomerNotifications(filters?: any): Observable<any> {
//   let url = `${this.API}/notifications`;
//   if (filters) {
//     const params = new URLSearchParams();
//     Object.keys(filters).forEach(key => {
//       if (filters[key]) params.append(key, filters[key]);
//     });
//     const qs = params.toString();
//     if (qs) url += `?${qs}`;
//   }
//   return this.http.get(url, { headers: this.getAuthHeaders() })
//     .pipe(catchError(this.handleError.bind(this)));
// }

// Mark a single notification as read
// markNotificationRead(notificationId: number): Observable<any> {
//   return this.http.put(`${this.API}/notifications/${notificationId}/read`, {}, { headers: this.getAuthHeaders() })
//     .pipe(catchError(this.handleError.bind(this)));
// }

// // Mark all notifications as read
// markAllNotificationsRead(): Observable<any> {
//   return this.http.post(`${this.API}/notifications/mark-all-read`, {}, { headers: this.getAuthHeaders() })
//     .pipe(catchError(this.handleError.bind(this)));
// }

// // Delete a notification
// deleteNotification(notificationId: number): Observable<any> {
//   return this.http.delete(`${this.API}/notifications/${notificationId}`, { headers: this.getAuthHeaders() })
//     .pipe(catchError(this.handleError.bind(this)));
// }

// // Clear all notifications
// clearAllNotifications(): Observable<any> {
//   return this.http.delete(`${this.API}/notifications/clear-all`, { headers: this.getAuthHeaders() })
//     .pipe(catchError(this.handleError.bind(this)));
// }

markCustomerNotificationRead(notificationId: number): Observable<any> {
  return this.http.put(`${this.API}/customer/notifications/${notificationId}/read`, {}, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Add to customers.service.ts

// Add reply to ticket
addTicketReply(ticketId: number, message: string): Observable<any> {
  return this.http.post(`${this.API}/customer/support/tickets/${ticketId}/reply`, { message }, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Close ticket
closeTicket(ticketId: number): Observable<any> {
  return this.http.put(`${this.API}/customer/support/tickets/${ticketId}/close`, {}, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Add these methods to customers.service.ts

// Get support tickets


// Get ticket details
getTicketDetails(ticketId: number): Observable<any> {
  return this.http.get(`${this.API}/customer/support/tickets/${ticketId}`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}
// customers.service.ts - Add these methods

// Create purchase order
createPurchaseOrder(orderData: any): Observable<any> {
  return this.http.post(`${this.API}/customer/purchase`, orderData, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Get customer orders
getCustomerOrders(): Observable<any> {
  return this.http.get(`${this.API}/customer/orders`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Get order details
getOrderDetails(orderId: number): Observable<any> {
  return this.http.get(`${this.API}/customer/orders/${orderId}`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Cancel order
cancelOrder(orderId: number): Observable<any> {
  return this.http.put(`${this.API}/customer/orders/${orderId}/cancel`, {}, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}
// Add these methods if not already present

// Get available products
// getAvailableProducts(filters?: any): Observable<any> {
//   let url = `${this.API}/customer/products`;
//   if (filters) {
//     const params = new URLSearchParams();
//     Object.keys(filters).forEach(key => {
//       if (filters[key]) params.append(key, filters[key]);
//     });
//     const qs = params.toString();
//     if (qs) url += `?${qs}`;
//   }
//   return this.http.get(url, { headers: this.getAuthHeaders() })
//     .pipe(catchError(this.handleError.bind(this)));
// }
// Add these methods

// Make instalment payment
// makeInstalmentPayment(paymentData: any): Observable<any> {
//   return this.http.post(`${this.API}/customer/instalments/pay`, paymentData, { headers: this.getAuthHeaders() })
//     .pipe(catchError(this.handleError.bind(this)));
// }

// Download receipt
downloadReceipt(planId: number, installmentNumber: number): Observable<Blob> {
  return this.http.get(`${this.API}/customer/instalments/${planId}/receipt/${installmentNumber}`, { 
    headers: this.getAuthHeaders(), 
    responseType: 'blob' 
  }).pipe(catchError(this.handleError.bind(this)));
}
// Get installment options
getInstallmentOptions(): Observable<any> {
  return this.http.get(`${this.API}/admin/settings/installments`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Calculate installment plan
calculateInstallmentPlan(data: any): Observable<any> {
  return this.http.post(`${this.API}/installment/calculate`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Add this method to customers.service.ts

makeInstalmentPayment(paymentData: any): Observable<any> {
  return this.http.post(`${this.API}/customer/instalments/pay`, paymentData, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}
// Add these methods if not already present

getCustomerDocuments(): Observable<any> {
  return this.http.get(`${this.API}/customer/documents`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

uploadKycDocuments(formData: FormData): Observable<any> {
  return this.http.post(`${this.API}/customer/documents/upload`, formData, { 
    headers: this.getAuthHeaders() 
  }).pipe(catchError(this.handleError.bind(this)));
}
// customers.service.ts - Add these methods

getCustomerNotifications(filters?: any): Observable<any> {
  let url = `${this.API}/notifications`;
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

markAllNotificationsRead(): Observable<any> {
  return this.http.post(`${this.API}/notifications/mark-all-read`, {}, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

deleteNotification(notificationId: number): Observable<any> {
  return this.http.delete(`${this.API}/notifications/${notificationId}`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

clearAllNotifications(): Observable<any> {
  return this.http.delete(`${this.API}/notifications/clear-all`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}
getCustomerKycStatus(): Observable<any> {
  return this.http.get(`${this.API}/customer/kyc/status`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}
// Create purchase order
// createPurchaseOrder(orderData: any): Observable<any> {
//   return this.http.post(`${this.API}/customer/purchase`, orderData, { headers: this.getAuthHeaders() })
//     .pipe(catchError(this.handleError.bind(this)));
// }

// // Get customer orders
// getCustomerOrders(): Observable<any> {
//   return this.http.get(`${this.API}/customer/orders`, { headers: this.getAuthHeaders() })
//     .pipe(catchError(this.handleError.bind(this)));
// }
}