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
  amount: number | null = null;      // total due now, from the server
  instalmentAmount = 0;
  lateFee = 0;
  planName: string = '';
  instalmentPlan: any = null;
  isLoading = true;
  isProcessing = false;
  isRedirecting = false;
  paystackEnabled = false;
  showManualForm = false;
  savedCards: any[] = [];
  paymentForm: FormGroup;

  paymentMethods = [
    { value: 'mobile_money', label: 'Mobile Money', icon: '📱', description: 'MTN MoMo, Telecel Cash, AirtelTigo Money' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', description: 'Direct bank transfer' },
    { value: 'card', label: 'Card Payment', icon: '💳', description: 'Credit/Debit card' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private fb: FormBuilder
  ) {
    // The amount due comes from the server; the customer only reports how they paid
    this.paymentForm = this.fb.group({
      payment_method: ['', Validators.required],
      payment_reference: ['', [Validators.required, Validators.minLength(4)]],
      notes: ['']
    });
  }

  loadSavedCards(): void {
    this.customerService.getSavedCards().subscribe({
      next: (res: any) => this.savedCards = res?.payment_methods || [],
      error: () => this.savedCards = []
    });
  }

  toggleAutopay(card: any): void {
    const enable = !card.autopay_enabled;
    if (enable && !confirm(`Charge card ending ${card.last4} automatically on each due date?`)) return;
    this.customerService.updateSavedCard(card.id, { autopay_enabled: enable }).subscribe({
      next: (res: any) => {
        alert(res?.message || 'Saved');
        this.loadSavedCards();
      },
      error: (error) => alert(error?.error?.error || 'Could not update autopay')
    });
  }

  removeCard(card: any): void {
    if (!confirm(`Remove card ending ${card.last4}? Autopay will stop for this card.`)) return;
    this.customerService.removeSavedCard(card.id).subscribe({
      next: () => this.loadSavedCards(),
      error: (error) => alert(error?.error?.error || 'Could not remove the card')
    });
  }

  ngOnInit(): void {
    this.loadSavedCards();
    this.customerService.getPaymentConfig().subscribe({
      next: (cfg) => {
        this.paystackEnabled = !!cfg?.paystack_enabled;
        this.showManualForm = !this.paystackEnabled;
      },
      error: () => {
        this.paystackEnabled = false;
        this.showManualForm = true;
      }
    });

    this.route.queryParams.subscribe(params => {
      this.planId = params['planId'] ? parseInt(params['planId']) : null;
      // Never show an amount from the URL: it comes from the server with the plan below
      this.amount = null;
      this.planName = params['planName'] || '';

      if (this.planId) {
        this.loadPlanDetails();
      } else {
        this.isLoading = false;
      }
    });
  }

  loadPlanDetails(): void {
    this.customerService.getPlanDetails(this.planId!).subscribe({
      next: (response) => {
        this.instalmentPlan = response;
        this.planName = this.instalmentPlan.product_name;
        const next = (this.instalmentPlan.payment_schedule || [])
          .find((p: any) => ['pending', 'overdue', 'pending_verification'].includes(p.status));
        // What Paystack will charge: the instalment plus any unpaid late fee
        this.amount = next ? (next.amount_due ?? next.amount) : 0;
        this.instalmentAmount = next ? next.amount : 0;
        this.lateFee = next ? (next.late_fee || 0) : 0;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  // Card / MoMo through Paystack: the server fixes the amount and returns Paystack's checkout page
  payWithPaystack(): void {
    if (!this.planId || this.isRedirecting) return;
    this.isRedirecting = true;
    this.customerService.startPaystackPayment(this.planId).subscribe({
      next: (res: any) => {
        if (res?.authorization_url) {
          window.location.href = res.authorization_url;
        } else {
          this.isRedirecting = false;
          alert('Could not start the payment. Please try again.');
        }
      },
      error: (error) => {
        this.isRedirecting = false;
        alert(error?.error?.error || 'Could not start the payment. Please try again.');
      }
    });
  }

  submitPayment(): void {
    if (this.paymentForm.invalid) return;

    this.isProcessing = true;

    const paymentData = {
      plan_id: this.planId,
      payment_method: this.paymentForm.value.payment_method,
      payment_reference: this.paymentForm.value.payment_reference,
      notes: this.paymentForm.value.notes
    };

    this.customerService.makeOnePayment(paymentData).subscribe({
      next: (response: any) => {
        this.isProcessing = false;
        alert(response?.message || 'Payment submitted for verification.');
        this.router.navigate(['/customer/instalments']);
      },
      error: (error) => {
        this.isProcessing = false;
        alert(error?.error?.error || 'Could not submit your payment. Please try again.');
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency', currency: 'GHS', currencyDisplay: 'code'
    }).format(amount || 0);
  }

  goBack(): void {
    this.router.navigate(['/customer/instalments']);
  }
}
