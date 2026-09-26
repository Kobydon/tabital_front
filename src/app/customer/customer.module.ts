import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';

import { CustomerRoutingModule } from './customer-routing.module';
import { CustomerLayoutComponent } from './layout/layout.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomerDashboardComponent } from './dashboard/dashboard.component';
import { CustomerPaymentsComponent } from './customer-payments/customer-payments.component';
import { CustomerInstalmentsComponent } from './customer-instalments/customer-instalments.component';
import { CustomerTransactionsComponent } from './customer-transactions/customer-transactions.component';
import { CustomerPlansComponent } from './customer-plans/customer-plans.component';
import { CustomerProfileComponent } from './customer-profile/customer-profile.component';
import { CustomerSupportComponent } from './customer-support/customer-support.component';
import { CustomerNotificationsComponent } from './customer-notifications/customer-notifications.component';
import {CustomerSettingsComponent } from './customer-setings/customer-setings.component';
import { CustomerOrdersComponent } from './customer-order/customer-order.component';
import { CustomerShopComponent } from './shop/shop.component';
import { MakePaymentComponent } from './make-payment/make-payment.component';
import { CustomerDocumentComponent } from './customer-document/customer-document.component';
import { PaymentCallbackComponent } from './payment-callback/payment-callback.component';
import { PayLinkComponent } from './pay-link/pay-link.component';
import { VerifyIdentityComponent } from './verify-identity/verify-identity.component';
// import { ShopComponent } from './shop/shop.component';
// import { CustomerOrderComponent } from './customer-order/customer-order.component';

// import { LayoutComponent } from '../cust/layout/layout.component';
// import { CustomerDashboardComponent } from './dashboard/dashboard.component';
// import { LayoutComponent } from './layout/layout.component';
// import { DashboardComponent } from './dashboard/dashboard.component';


@NgModule({
  declarations: [
    CustomerLayoutComponent,
    CustomerDashboardComponent,
    CustomerPaymentsComponent,
    CustomerInstalmentsComponent,
    CustomerTransactionsComponent,
    CustomerPlansComponent,
    CustomerProfileComponent,
    CustomerSupportComponent,
    CustomerNotificationsComponent,
  CustomerSettingsComponent,
  CustomerOrdersComponent,
  CustomerShopComponent,
  MakePaymentComponent,
  CustomerDocumentComponent,
  PaymentCallbackComponent,
  PayLinkComponent,
  VerifyIdentityComponent
  ],
  // <smart-camera-web> is Smile ID's web component (Phase 6)
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    CustomerRoutingModule,RouterModule,FormsModule,ReactiveFormsModule,TitleCasePipe
    
    
  ]
})
export class CustomerModule { }
