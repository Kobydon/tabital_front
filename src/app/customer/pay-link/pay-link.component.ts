import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from 'src/app/customers.service';
import { InstallmentCalculation } from '../shop/shop.component';

/** Checkout from a merchant's payment link / QR code (in-store or WhatsApp sale). */
@Component({
  selector: 'app-pay-link',
  templateUrl: './pay-link.component.html',
  styleUrls: ['./pay-link.component.scss']
})
export class PayLinkComponent implements OnInit {
  token = '';
  link: any = null;
  loading = true;
  linkError = '';

  readonly plans = [
    { n: 4, label: 'Pay in 4' },
    { n: 3, label: 'Pay in 3' },
    { n: 2, label: 'Pay in 2' },
    { n: 1, label: 'Pay in full' }
  ];
  selected = 4;
  calculation: InstallmentCalculation | null = null;
  calculating = false;

  agreed = false;
  placing = false;
  orderError = '';
  orderReasons: string[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private customerService: CustomerService) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.customerService.getPaymentLink(this.token).subscribe({
      next: (link: any) => {
        this.link = link;
        this.loading = false;
        this.quote();
      },
      error: (err: any) => {
        this.loading = false;
        this.linkError = err.error?.error || 'This link could not be opened.';
      }
    });
  }

  choose(n: number) {
    if (this.selected === n) return;
    this.selected = n;
    this.agreed = false;
    this.quote();
  }

  quote() {
    if (!this.link) return;
    this.calculating = true;
    this.calculation = null;
    // The server prices the plan; nothing is calculated here
    this.customerService.calculateInstallmentPlan({
      product_price: this.link.product.price,
      quantity: this.link.quantity,
      number_of_installments: this.selected,
      in_store: true
    }).subscribe({
      next: (res: InstallmentCalculation) => { this.calculation = res; this.calculating = false; },
      error: () => { this.calculating = false; this.orderError = 'We could not price this plan. Please try again.'; }
    });
  }

  /** Why this plan can't be bought, or null (the server checks again at checkout). */
  blockReason(): string | null {
    const credit = this.calculation?.credit;
    if (!credit || this.selected === 1) return null;
    if (!credit.eligible) return credit.reasons?.[0] || 'You are not eligible for a payment plan yet';
    if ((this.calculation?.product_price || 0) > credit.available_limit) {
      return `This is above your available limit of ${this.formatCurrency(credit.available_limit)}`;
    }
    return null;
  }

  confirm() {
    if (!this.calculation || !this.agreed || this.blockReason()) return;
    this.placing = true;
    this.orderError = '';
    this.orderReasons = [];
    this.customerService.createPurchaseOrder({
      payment_link: this.token,
      number_of_installments: this.selected
    }).subscribe({
      next: (res: any) => {
        // Down payment (Payment 1) is collected now through Paystack
        if (res?.authorization_url) {
          window.location.href = res.authorization_url;
          return;
        }
        this.placing = false;
        this.router.navigate(['/customer/orders']);
      },
      error: (err: any) => {
        this.placing = false;
        this.orderError = err.error?.error || 'We could not place this order. Please try again.';
        this.orderReasons = err.error?.reasons || [];
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount || 0);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
