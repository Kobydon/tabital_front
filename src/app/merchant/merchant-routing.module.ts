import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../auth/auth.guard';
// import { RoleGuard } from '../guards/role.guard';
import { MerchantLayoutComponent } from './merchant-layout/merchant-layout.component';
import { MerchantDashboardComponent } from './merchant-dashboard/merchant-dashboard.component';
import { MerchantTransactionsComponent } from './merchant-transactions/merchant-transactions.component';
import { MerchantInstalmentsComponent } from './merchant-instalments/merchant-instalments.component';
import { MerchantCustomersComponent } from './merchant-customers/merchant-customers.component';
import { MerchantSettlementsComponent } from './merchant-settlements/merchant-settlements.component';
import { MerchantDisputesComponent } from './merchant-disputes/merchant-disputes.component';
import { MerchantReportsComponent } from './merchant-reports/merchant-reports.component';
import { MerchantSettingsComponent } from './merchant-settings/merchant-settings.component';
import { MerchantNotificationsComponent } from './merchant-notifications/merchant-notifications.component';
import { MerchantSupportComponent } from './merchant-support/merchant-support.component';
import { RoleGuard } from '../role.guard';

const routes: Routes = [
  {
    path: '',
    component: MerchantLayoutComponent,
    canActivate: [AuthGuard],
    data: { role: 'merchant' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: MerchantDashboardComponent, data: { title: 'Dashboard' } },
      { path: 'transactions', component: MerchantTransactionsComponent, data: { title: 'Transactions' } },
      { path: 'instalments', component: MerchantInstalmentsComponent, data: { title: 'Instalments' } },
      { path: 'customers', component: MerchantCustomersComponent, data: { title: 'Customers' } },
      { path: 'settlements', component: MerchantSettlementsComponent, data: { title: 'Settlements' } },
      { path: 'disputes', component: MerchantDisputesComponent, data: { title: 'Disputes' } },
      { path: 'reports', component: MerchantReportsComponent, data: { title: 'Reports' } },
      { path: 'settings', component: MerchantSettingsComponent, data: { title: 'Settings' } },
      { path: 'notifications', component: MerchantNotificationsComponent, data: { title: 'Notifications' } },
      { path: 'support', component: MerchantSupportComponent, data: { title: 'Support' } },
      
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MerchantRoutingModule { }