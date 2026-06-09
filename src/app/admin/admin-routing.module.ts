import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LayoutComponent } from './layout/layout.component';
import { AuthGuard } from '../auth/auth.guard';
import { CustomersComponent } from './customers/customers.component';
import { MerchantsComponent } from './merchants/merchants.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { MerchantDetailsComponent } from './merchant-details/merchant-details.component';
import { ChargesComponent } from './charges/charges.component';
import { AdminOrdersComponent } from './orders/orders.component';
import { ApproveKybKycComponent } from './approve-kyb-kyc/approve-kyb-kyc.component';
import { ApproveCustomerKycComponent } from './appove-customer-kyc/appove-customer-kyc.component';
import { CustomersOverviewComponent } from './customers-overview/customers-overview.component';
import { MerchantOverviewComponent } from './merchant-overview/merchant-overview.component';
import { AdminTransactionsComponent } from './admin-transactions/admin-transactions.component';
import { AdminInstalmentsComponent } from './admin-instalments/admin-instalments.component';
import { AdminCollectionComponent } from './admin-collection/admin-collection.component';
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
      { path: 'users', component: DashboardComponent },  // Replace with actual component
      { path: 'merchants', component: MerchantsComponent },  // Replace with actual component
      { path: 'settings', component: DashboardComponent }  ,// Replace with actual component
      {path: 'customers', component: CustomersComponent },  // Replace with actual component
        {path: 'transactions', component: TransactionsComponent } , // Replace with actual component
          {path: 'merchants-details/:id', component: MerchantDetailsComponent } , // Replace with actual component
           {path: 'charges', component: ChargesComponent } , 
               {path: 'orders', component: AdminOrdersComponent } , 
   
    
        { path: 'kyb-verification', component: ApproveKybKycComponent },
             { path: 'kyc-verification', component: ApproveCustomerKycComponent },
    { path: 'customer-overview', component: CustomersOverviewComponent },
     { path: 'merchant-overview', component: MerchantOverviewComponent   },
      { path: 'all-transactions', component: AdminTransactionsComponent   },
       { path: 'all-installments', component: AdminInstalmentsComponent   },
        { path: 'collections', component: AdminCollectionComponent   },
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