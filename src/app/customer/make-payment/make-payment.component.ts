// src/app/customer/components/make-payment/make-payment.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from 'src/app/customers.service';

@Component({
  selector: 'app-make-payment',
  templateUrl: './make-payment.component.html',
  styleUrls: ['./make-payment.component.scss']
})
export class MakePaymentComponent implements OnInit {
  planId: number | null = null;
  amount: number | null = null;
  planName: string = '';
  instalmentPlan: any = null;
  isLoading = true;
  isProcessing = false;
  paymentForm: FormGroup;
  
  paymentMethods = [
    { value: 'mobile_money', label: 'Mobile Money', icon: '📱', description: 'Pay via MTN, Vodafone, AirtelTigo' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', description: 'Direct bank transfer' },
    { value: 'card', label: 'Card Payment', icon: '💳', description: 'Credit/Debit card' },
    { value: 'cash', label: 'Cash', icon: '💰', description: 'Pay at merchant location' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private fb: FormBuilder
  ) {
    this.paymentForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      payment_method: ['', Validators.required],
      payment_reference: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.planId = params['planId'] ? parseInt(params['planId']) : null;
      this.amount = params['amount'] ? parseFloat(params['amount']) : null;
      this.planName = params['planName'] || '';
      
      if (this.planId) {
        this.loadPlanDetails();
      } else {
        this.isLoading = false;
      }
      
      if (this.amount) {
        this.paymentForm.patchValue({ amount: this.amount });
      }
    });
  }

  loadPlanDetails(): void {
    this.customerService.getPlanDetails(this.planId!).subscribe({
      next: (response) => {
        this.instalmentPlan = response;
        this.planName = this.instalmentPlan.product_name;
        if (!this.amount) {
          this.paymentForm.patchValue({ amount: this.instalmentPlan.next_payment_amount });
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading plan details:', error);
        this.isLoading = false;
      }
    });
  }

  submitPayment(): void {
    if (this.paymentForm.invalid) return;
    
    this.isProcessing = true;
    
    const paymentData = {
      plan_id: this.planId,
      amount: this.paymentForm.value.amount,
      payment_method: this.paymentForm.value.payment_method,
      payment_reference: this.paymentForm.value.payment_reference,
      notes: this.paymentForm.value.notes
    };
    
    this.customerService.makeOnePayment(paymentData).subscribe({
      next: (response) => {
        this.isProcessing = false;
        alert('Payment successful!');
        this.router.navigate(['/customer/instalments']);
      },
      error: (error) => {
        console.error('Error making payment:', error);
        this.isProcessing = false;
        alert('Payment failed. Please try again.');
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GH', { 
      style: 'currency', currency: 'GHS'
    }).format(amount || 0);
  }

  goBack(): void {
    this.router.navigate(['/customer/instalments']);
  }
}