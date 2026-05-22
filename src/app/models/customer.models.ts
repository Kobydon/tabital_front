// src/app/models/customer.models.ts
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
  monthly_data: MonthlyPaymentData[];
  total_paid: number;
  total_outstanding: number;
}

export interface MonthlyPaymentData {
  month: string;
  paid: number;
  outstanding: number;
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
  plan_name: string;
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
}

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
  kyc_level?: string;
  income_range?: string;
  created_at: string;
  total_spent?: number;
  active_plans_count?: number;
  completed_plans_count?: number;
}