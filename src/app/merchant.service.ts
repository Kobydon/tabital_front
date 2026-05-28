import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MerchantService {
  private API = 'https://tabital.onrender.com';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  // Dashboard APIs
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.API}/merchant/dashboard/stats`, { headers: this.getAuthHeaders() });
  }

  getSalesChart(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/merchant/dashboard/sales-chart`, { headers: this.getAuthHeaders() });
  }

  getRecentTransactions(limit: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/merchant/transactions/recent?limit=${limit}`, { headers: this.getAuthHeaders() });
  }

  getInstalmentsOverview(): Observable<any> {
    return this.http.get(`${this.API}/merchant/instalments/overview`, { headers: this.getAuthHeaders() });
  }

  getSettlementInfo(): Observable<any> {
    return this.http.get(`${this.API}/merchant/settlements/info`, { headers: this.getAuthHeaders() });
  }

  getAccountStatus(): Observable<any> {
    return this.http.get(`${this.API}/merchant/account/status`, { headers: this.getAuthHeaders() });
  }

  quickAction(action: string, data?: any): Observable<any> {
    return this.http.post(`${this.API}/merchant/quick-actions`, { action, ...data }, { headers: this.getAuthHeaders() });
  }

  // Instalment Plans
getInstalments(): Observable<any[]> {
  return this.http.get<any[]>(`${this.API}/merchant/instalments`, { headers: this.getAuthHeaders() });
}

createInstalmentPlan(data: any): Observable<any> {
  return this.http.post(`${this.API}/merchant/instalments/create`, data, { headers: this.getAuthHeaders() });
}

updateInstalmentPlan(id: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/merchant/instalments/${id}`, data, { headers: this.getAuthHeaders() });
}

deleteInstalmentPlan(id: number): Observable<any> {
  return this.http.delete(`${this.API}/merchant/instalments/${id}`, { headers: this.getAuthHeaders() });
}

getInstalmentDetails(id: number): Observable<any> {
  return this.http.get(`${this.API}/merchant/instalments/${id}/details`, { headers: this.getAuthHeaders() });
}

recordInstalmentPayment(id: number, data: any): Observable<any> {
  return this.http.post(`${this.API}/merchant/instalments/${id}/pay`, data, { headers: this.getAuthHeaders() });
}


// Add to MerchantService class

// ============================================
// TRANSACTION ENDPOINTS
// ============================================

getMerchantTransactions(filters?: any): Observable<any> {
  let url = `${this.API}/merchant/transactions`;
  if (filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { headers: this.getAuthHeaders() });
}
getMerchantPayoutStats(): Observable<any> {
  return this.http.get(`${this.API}/merchant/payouts/stats`);
}

getRecentPayouts(limit: number = 5): Observable<any> {
    return this.http.get(`${this.API}/merchant/payouts/recent?limit=${limit}`);
  }
getTransactionStats(): Observable<any> {
  return this.http.get(`${this.API}/merchant/transactions/stats`);
}

getMerchantTransactionStats(): Observable<any> {
  return this.http.get(`${this.API}/merchant/transactions/stats`, { headers: this.getAuthHeaders() });
}

updateTransactionStatus(id: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/merchant/transactions/${id}/status`, data, { headers: this.getAuthHeaders() });
}

updateTransaction(id: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/merchant/transactions/${id}`, data, { headers: this.getAuthHeaders() });
}

refundTransaction(id: number, data: any): Observable<any> {
  return this.http.post(`${this.API}/merchant/transactions/${id}/refund`, data, { headers: this.getAuthHeaders() });
}

exportTransactions(filters?: any): Observable<Blob> {
  let url = `${this.API}/merchant/transactions/export`;
  if (filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { headers: this.getAuthHeaders(), responseType: 'blob' });
}

// Add to MerchantService class

// ============================================
// CUSTOMER ENDPOINTS
// ============================================

getMerchantCustomers(filters?: any): Observable<any> {
  let url = `${this.API}/merchant/customers`;
  if (filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { headers: this.getAuthHeaders() });
}

getCustomerDetails(customerId: number): Observable<any> {
  return this.http.get(`${this.API}/merchant/customers/${customerId}`, { headers: this.getAuthHeaders() });
}

updateCustomer(customerId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/merchant/customers/${customerId}`, data, { headers: this.getAuthHeaders() });
}

getCustomerStats(): Observable<any> {
  return this.http.get(`${this.API}/merchant/customers/stats`, { headers: this.getAuthHeaders() });
}

exportCustomers(): Observable<Blob> {
  return this.http.get(`${this.API}/merchant/customers/export`, { 
    headers: this.getAuthHeaders(), 
    responseType: 'blob' 
  });
}

// Add to MerchantService class

// ============================================
// SETTLEMENT ENDPOINTS
// ============================================

getMerchantSettlements(filters?: any): Observable<any> {
  let url = `${this.API}/merchant/settlements`;
  if (filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { headers: this.getAuthHeaders() });
}

getSettlementSummary(): Observable<any> {
  return this.http.get(`${this.API}/merchant/settlements/summary`, { headers: this.getAuthHeaders() });
}

requestPayout(amount: number): Observable<any> {
  return this.http.post(`${this.API}/merchant/settlements/request-payout`, { amount }, { headers: this.getAuthHeaders() });
}

updateSettlementSettings(settings: any): Observable<any> {
  return this.http.put(`${this.API}/merchant/settlements/settings`, settings, { headers: this.getAuthHeaders() });
}

getSettlementDetails(settlementId: string): Observable<any> {
  return this.http.get(`${this.API}/merchant/settlements/${settlementId}`, { headers: this.getAuthHeaders() });
}


// Add to MerchantService class

// ============================================
// DISPUTE ENDPOINTS
// ============================================

getMerchantDisputes(filters?: any): Observable<any> {
  let url = `${this.API}/merchant/disputes`;
  if (filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return this.http.get(url, { headers: this.getAuthHeaders() });
}

getDisputeStats(): Observable<any> {
  return this.http.get(`${this.API}/merchant/disputes/stats`, { headers: this.getAuthHeaders() });
}

getDisputeDetails(disputeId: number): Observable<any> {
  return this.http.get(`${this.API}/merchant/disputes/${disputeId}`, { headers: this.getAuthHeaders() });
}

updateDispute(disputeId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/merchant/disputes/${disputeId}`, data, { headers: this.getAuthHeaders() });
}

acceptDispute(disputeId: number, data: any): Observable<any> {
  return this.http.post(`${this.API}/merchant/disputes/${disputeId}/accept`, data, { headers: this.getAuthHeaders() });
}

rejectDispute(disputeId: number, data: any): Observable<any> {
  return this.http.post(`${this.API}/merchant/disputes/${disputeId}/reject`, data, { headers: this.getAuthHeaders() });
}

escalateDispute(disputeId: number, data: any): Observable<any> {
  return this.http.post(`${this.API}/merchant/disputes/${disputeId}/escalate`, data, { headers: this.getAuthHeaders() });
}

// Add to MerchantService class

// ============================================
// REPORT ENDPOINTS
// ============================================

getSalesReport(params: any): Observable<any> {
  let url = `${this.API}/merchant/reports/sales`;
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  const qs = queryParams.toString();
  if (qs) url += `?${qs}`;
  return this.http.get(url, { headers: this.getAuthHeaders() });
}

getTransactionReport(params: any): Observable<any> {
  let url = `${this.API}/merchant/reports/transactions`;
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  const qs = queryParams.toString();
  if (qs) url += `?${qs}`;
  return this.http.get(url, { headers: this.getAuthHeaders() });
}

getCustomerReport(params: any): Observable<any> {
  let url = `${this.API}/merchant/reports/customers`;
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  const qs = queryParams.toString();
  if (qs) url += `?${qs}`;
  return this.http.get(url, { headers: this.getAuthHeaders() });
}

getFinancialReport(params: any): Observable<any> {
  let url = `${this.API}/merchant/reports/financial`;
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  const qs = queryParams.toString();
  if (qs) url += `?${qs}`;
  return this.http.get(url, { headers: this.getAuthHeaders() });
}

getInstalmentReport(): Observable<any> {
  return this.http.get(`${this.API}/merchant/reports/instalments`, { headers: this.getAuthHeaders() });
}

exportReport(params: any): Observable<Blob> {
  let url = `${this.API}/merchant/reports/export`;
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  const qs = queryParams.toString();
  if (qs) url += `?${qs}`;
  return this.http.get(url, { headers: this.getAuthHeaders(), responseType: 'blob' });
}

// Add to MerchantService class

// ============================================
// SETTINGS ENDPOINTS
// ============================================

getProfile(): Observable<any> {
  return this.http.get(`${this.API}/merchant/settings/profile`, { headers: this.getAuthHeaders() });
}

updateProfile(data: any): Observable<any> {
  return this.http.put(`${this.API}/merchant/settings/profile`, data, { headers: this.getAuthHeaders() });
}

updatePassword(data: any): Observable<any> {
  return this.http.put(`${this.API}/merchant/settings/password`, data, { headers: this.getAuthHeaders() });
}

updatePaymentSettings(data: any): Observable<any> {
  return this.http.put(`${this.API}/merchant/settings/payment`, data, { headers: this.getAuthHeaders() });
}

// getNotificationSettings(): Observable<any> {
//   return this.http.get(`${this.API}/merchant/settings/notifications`, { headers: this.getAuthHeaders() });
// }

// updateNotificationSettings(data: any): Observable<any> {
//   return this.http.put(`${this.API}/merchant/settings/notifications`, data, { headers: this.getAuthHeaders() });
// }

getPreferences(): Observable<any> {
  return this.http.get(`${this.API}/merchant/settings/preferences`, { headers: this.getAuthHeaders() });
}

updatePreferences(data: any): Observable<any> {
  return this.http.put(`${this.API}/merchant/settings/preferences`, data, { headers: this.getAuthHeaders() });
}

updateKYC(data: any): Observable<any> {
  return this.http.put(`${this.API}/merchant/settings/kyc`, data, { headers: this.getAuthHeaders() });
}

uploadDocument(file: File, documentType: string): Observable<any> {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('document_type', documentType);
  return this.http.post(`${this.API}/merchant/settings/upload-document`, formData, { headers: this.getAuthHeaders() });
}

getActivityLog(): Observable<any> {
  return this.http.get(`${this.API}/merchant/settings/activity-log`, { headers: this.getAuthHeaders() });
}


// Update these methods in MerchantService

getNotificationSettings(): Observable<any> {
  return this.http.get(`${this.API}/merchant/settings/notifications`, { headers: this.getAuthHeaders() });
}

updateNotificationSettings(data: any): Observable<any> {
  return this.http.put(`${this.API}/merchant/settings/notifications`, data, { headers: this.getAuthHeaders() });
}


 getMerchantProducts(filters?: any): Observable<any> {
    let url = `${this.API}/merchant/products`;
    if (filters) {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }
    return this.http.get(url, { headers: this.getAuthHeaders() });
  }

  getProductDetails(productId: number): Observable<any> {
    return this.http.get(`${this.API}/merchant/products/${productId}`, { headers: this.getAuthHeaders() });
  }

  createProduct(productData: any): Observable<any> {
    return this.http.post(`${this.API}/merchant/products`, productData, { headers: this.getAuthHeaders() });
  }

  updateProduct(productId: number, productData: any): Observable<any> {
    return this.http.put(`${this.API}/merchant/products/${productId}`, productData, { headers: this.getAuthHeaders() });
  }

  deleteProduct(productId: number): Observable<any> {
    return this.http.delete(`${this.API}/merchant/products/${productId}`, { headers: this.getAuthHeaders() });
  }

  uploadProductImage(file: File, productId?: number): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    if (productId) {
      formData.append('product_id', productId.toString());
    }
    return this.http.post(`${this.API}/merchant/products/upload-image`, formData, { headers: this.getAuthHeaders() });
  }

  // Generic error handler for HTTP requests
  private handleError(error: any): Observable<never> {
    // You can customize this as needed
    console.error('An error occurred:', error);
    throw error;
  }
  
// merchant.service.ts - Add these methods

// Get merchant orders
getMerchantOrders(filters?: any): Observable<any> {
  let url = `${this.API}/merchant/orders`;
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

// Update order delivery status
updateOrderDelivery(orderId: number, data: any): Observable<any> {
  return this.http.put(`${this.API}/merchant/orders/${orderId}/delivery`, data, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}
// Add these methods to merchant.service.ts

// Get merchant documents
getMerchantDocuments(): Observable<any> {
  return this.http.get(`${this.API}/merchant/documents`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Get KYC status
getKycStatus(): Observable<any> {
  return this.http.get(`${this.API}/merchant/kyc/status`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Get bank details
getBankDetails(): Observable<any> {
  return this.http.get(`${this.API}/merchant/bank-details`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Update bank details
updateBankDetails(bankDetails: any): Observable<any> {
  return this.http.put(`${this.API}/merchant/bank-details`, bankDetails, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Upload merchant documents
// In your service, temporarily add this before the POST:

 uploadMerchantDocuments(formData: FormData): Observable<any> {
    // Debug: Log all form data entries using forEach (compatible with all browsers)
    console.log('=== Uploading Documents ===');
    
    // Use forEach instead of entries() for better compatibility
    formData.forEach((value, key) => {
      if (value instanceof File) {
        console.log(`${key}: ${value.name} (${value.size} bytes, type: ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    });
    
    // Get auth token
    const token = localStorage.getItem('access_token');
    
    // Create headers with auth token only (no Content-Type for FormData)
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    // IMPORTANT: Do NOT set Content-Type header - let browser handle it for FormData
    return this.http.post(`${this.API}/merchant/documents/upload`, formData, { headers });
  }

// Add these methods to merchant.service.ts

// Get merchant notifications
getMerchantNotifications(filters?: any): Observable<any> {
  let url = `${this.API}/merchant/notifications`;
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

// Get merchant notification settings
getMerchantNotificationSettings(): Observable<any> {
  return this.http.get(`${this.API}/merchant/notifications/settings`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Update merchant notification settings
updateMerchantNotificationSettings(settings: any): Observable<any> {
  return this.http.put(`${this.API}/merchant/notifications/settings`, settings, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Mark notification as read
markMerchantNotificationRead(notificationId: string): Observable<any> {
  return this.http.put(`${this.API}/merchant/notifications/${notificationId}/read`, {}, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Mark all notifications as read
markAllMerchantNotificationsRead(): Observable<any> {
  return this.http.post(`${this.API}/merchant/notifications/mark-all-read`, {}, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Delete notification
deleteMerchantNotification(notificationId: string): Observable<any> {
  return this.http.delete(`${this.API}/merchant/notifications/${notificationId}`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}

// Clear all notifications
clearAllMerchantNotifications(): Observable<any> {
  return this.http.delete(`${this.API}/merchant/notifications/clear-all`, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError.bind(this)));
}
  getMerchantUnreadCount(): Observable<any> {
    return this.http.get(`${this.API}/merchant/notifications/unread-count`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }
}