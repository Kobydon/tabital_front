// src/app/customer/customer-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../auth/auth.guard';
import { RoleGuard } from '../role.guard';
import { CustomerLayoutComponent } from './layout/layout.component';
import { CustomerDashboardComponent } from './dashboard/dashboard.component';
import { CustomerPaymentsComponent } from './customer-payments/customer-payments.component';
import { CustomerInstalmentsComponent } from './customer-instalments/customer-instalments.component';
import { CustomerTransactionsComponent } from './customer-transactions/customer-transactions.component';
import { CustomerPlansComponent } from './customer-plans/customer-plans.component';
import { CustomerProfileComponent } from './customer-profile/customer-profile.component';
import { CustomerSupportComponent } from './customer-support/customer-support.component';
import { CustomerNotificationsComponent } from './customer-notifications/customer-notifications.component';
import { CustomerSettingsComponent } from './customer-setings/customer-setings.component';
import { CustomerOrdersComponent } from './customer-order/customer-order.component';
import { CustomerShopComponent } from './shop/shop.component';
import { MakePaymentComponent } from './make-payment/make-payment.component';
import { CustomerDocumentComponent } from './customer-document/customer-document.component';
// import { CustomerSetingsComponent } from './customer-setings/customer-setings.component';


const routes: Routes = [
  {
    path: '',
    component: CustomerLayoutComponent,
    canActivate: [AuthGuard,RoleGuard],
    data: { role: 'customer' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: CustomerDashboardComponent, data: { title: 'Dashboard' } },
      { path: 'payments', component: CustomerPaymentsComponent, data: { title: 'My Payments' } },
      { path: 'instalments', component: CustomerInstalmentsComponent, data: { title: 'My Instalments' } },
      { path: 'transactions', component: CustomerTransactionsComponent, data: { title: 'Transactions' } },
      { path: 'plans', component: CustomerPlansComponent, data: { title: 'Available Plans' } },
      { path: 'profile', component: CustomerProfileComponent, data: { title: 'My Profile' } },
      { path: 'support', component: CustomerSupportComponent, data: { title: 'Support' } },
      { path: 'settings', component: CustomerSettingsComponent, data: { title: 'Settings' } },
      { path: 'notifications', component: CustomerNotificationsComponent, data: { title: 'Notifications' } },
      { path: 'orders', component: CustomerOrdersComponent, data: { title: 'Orders' } },
        { path: 'shop', component: CustomerShopComponent, data: { title: 'Shop' } },
         { path: 'make-payment', component: MakePaymentComponent, data: { title: 'make-payment' } },
         { path: 'documents', component: CustomerDocumentComponent, data: { title: 'Document Verification' } }
      
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomerRoutingModule { }