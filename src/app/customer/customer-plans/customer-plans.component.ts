import { Component } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Extended plans (6 and 12 months) are for eligible customers only and are
 * not open yet (CLAUDE.md §13.1 D7). This page explains what is coming and
 * sends customers to the standard plans in the Shop. It offers no quotes or
 * applications until the plan rules (down payment, fee) are finalised.
 */
@Component({
  selector: 'app-customer-plans',
  templateUrl: './customer-plans.component.html',
  styleUrls: ['./customer-plans.component.scss']
})
export class CustomerPlansComponent {
  readonly upcomingPlans = [
    { months: 6, label: '6-Month Plan' },
    { months: 12, label: '12-Month Plan' }
  ];

  // Eligibility rule from the founder decisions; shown as text only
  readonly requiredOnTimePurchases = 3;

  constructor(private router: Router) {}

  goToShop(): void {
    this.router.navigate(['/customer/shop']);
  }
}
