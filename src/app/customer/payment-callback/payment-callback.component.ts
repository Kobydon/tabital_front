import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from 'src/app/customers.service';

type CallbackState = 'checking' | 'paid' | 'deferred' | 'pending' | 'failed' | 'mismatch' | 'refund' | 'error';

/**
 * Paystack redirects here with ?reference=...&trxref=... after checkout.
 * The page asks the server to verify the payment with Paystack; it never
 * decides on its own that a payment succeeded.
 */
@Component({
  selector: 'app-payment-callback',
  templateUrl: './payment-callback.component.html',
  styleUrls: ['./payment-callback.component.scss']
})
export class PaymentCallbackComponent implements OnInit {
  state: CallbackState = 'checking';
  reference = '';
  result: any = null;
  message = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.reference = params.get('reference') || params.get('trxref') || '';
    if (!this.reference) {
      this.state = 'error';
      this.message = 'No payment reference was returned.';
      return;
    }
    this.verify();
  }

  verify(): void {
    this.state = 'checking';
    this.customerService.verifyPaystackPayment(this.reference).subscribe({
      next: (res: any) => {
        this.result = res;
        const outcome = res?.outcome;
        if (res?.purpose === 'deferment_fee' && (outcome === 'deferred' || outcome === 'already_applied')) {
          this.state = 'deferred';
        } else if (outcome === 'applied' || outcome === 'already_applied') {
          this.state = 'paid';
        } else if (outcome === 'duplicate_payment') {
          this.state = 'paid';
          this.message = 'This was already paid, so we will review this payment for a refund.';
        } else if (outcome === 'refund_required') {
          this.state = 'refund';
        } else if (outcome === 'amount_mismatch' || outcome === 'reference_mismatch') {
          this.state = 'mismatch';
        } else if (res?.status === 'failed' || res?.status === 'abandoned') {
          this.state = 'failed';
        } else {
          this.state = 'pending';
        }
      },
      error: (err) => {
        this.state = 'error';
        this.message = err?.error?.error || 'We could not confirm the payment yet.';
      }
    });
  }

  isDownPayment(): boolean {
    return this.result?.purpose === 'down_payment';
  }

  goToInstalments(): void {
    this.router.navigate(['/customer/instalments']);
  }

  goToOrders(): void {
    this.router.navigate(['/customer/orders']);
  }

  tryAgain(): void {
    // A checkout down payment is retried from My Orders; instalments from Make Payment
    if (this.isDownPayment()) {
      this.goToOrders();
      return;
    }
    const planId = this.result?.plan_id;
    this.router.navigate(['/customer/make-payment'], { queryParams: planId ? { planId } : {} });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount || 0);
  }
}
