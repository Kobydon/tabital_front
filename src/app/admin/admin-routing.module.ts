import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LayoutComponent } from './layout/layout.component';
import { AuthGuard } from '../auth/auth.guard';
import { TransactionsComponent } from './transactions/transactions.component';
import { AdminOrdersComponent } from './orders/orders.component';
import { ApproveKybKycComponent } from './approve-kyb-kyc/approve-kyb-kyc.component';
import { ApproveCustomerKycComponent } from './appove-customer-kyc/appove-customer-kyc.component';
import { CustomersOverviewComponent } from './customers-overview/customers-overview.component';
import { MerchantOverviewComponent } from './merchant-overview/merchant-overview.component';
import { AdminTransactionsComponent } from './admin-transactions/admin-transactions.component';
import { AdminInstalmentsComponent } from './admin-instalments/admin-instalments.component';
import { AdminCollectionComponent } from './admin-collection/admin-collection.component';
import { AdminDisputesComponent } from './admin-disputes/admin-disputes.component';
import { IdentityReviewComponent } from './identity-review/identity-review.component';
import { FraudReviewComponent } from './fraud-review/fraud-review.component';
import { UnitEconomicsComponent } from './unit-economics/unit-economics.component';
import { PiiAccessLogComponent } from './pii-access-log/pii-access-log.component';
import { TeamComponent } from './team/team.component';
import { SettlementsComponent } from './settlements/settlements.component';
import { ReportsAnalyticsComponent } from './reports-analytics/reports-analytics.component';
import { ProductPlansComponent } from './product-plans/product-plans.component';
import { AllUsersComponent } from './all-users/all-users.component';
import { SystemSettingsComponent } from './system-settings/system-settings.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,  // ✅ Use LayoutComponent as the wrapper
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      
      // Future pages
      { path: 'users', redirectTo: 'all-users', pathMatch: 'full' },  // old duplicate page: use the current one
      { path: 'merchants', redirectTo: 'merchant-overview', pathMatch: 'full' },  // old duplicate page: use the current one
      { path: 'settings', redirectTo: 'system-settings', pathMatch: 'full' }  ,// Replace with actual component
      { path: 'customers', redirectTo: 'customer-overview', pathMatch: 'full' },  // old duplicate page: use the current one
        {path: 'transactions', component: TransactionsComponent } , // Replace with actual component
          { path: 'merchants-details/:id', redirectTo: 'merchant-overview' }, // Replace with actual component
           { path: 'charges', redirectTo: 'system-settings', pathMatch: 'full' },  // retired: edited settings without validation 
               {path: 'orders', component: AdminOrdersComponent } , 
   
    
        { path: 'kyb-verification', component: ApproveKybKycComponent },
             { path: 'kyc-verification', component: ApproveCustomerKycComponent },
    { path: 'customer-overview', component: CustomersOverviewComponent },
     { path: 'merchant-overview', component: MerchantOverviewComponent   },
      { path: 'all-transactions', component: AdminTransactionsComponent   },
       { path: 'all-installments', component: AdminInstalmentsComponent   },
        { path: 'collections', component: AdminCollectionComponent   },
        { path: 'disputes', component: AdminDisputesComponent },
      { path: 'identity-review', component: IdentityReviewComponent },
      { path: 'fraud-review', component: FraudReviewComponent },
      { path: 'unit-economics', component: UnitEconomicsComponent },
      { path: 'data-access', component: PiiAccessLogComponent },
      { path: 'team', component: TeamComponent },
         { path: 'settlements', component: SettlementsComponent   },
          { path: 'all-reports', component: ReportsAnalyticsComponent   },
            { path: 'product-plans', component: ProductPlansComponent   },
                 { path: 'all-users', component: AllUsersComponent   },
                 { path: 'system-settings', component: SystemSettingsComponent   },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }