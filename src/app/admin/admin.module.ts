import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe, TitleCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
 import { LayoutComponent } from './layout/layout.component';
import { AdminRoutingModule } from './admin-routing.module';
import { CustomersComponent } from './customers/customers.component';
import { MerchantsComponent } from './merchants/merchants.component';
import { AllUsersComponent } from './all-users/all-users.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TransactionsComponent } from './transactions/transactions.component';
import { MerchantDetailsComponent } from './merchant-details/merchant-details.component';
import { ChargesComponent } from './charges/charges.component';
import { AdminOrdersComponent } from './orders/orders.component';
// import { ApproveKybKycComponent } from './approve-kyb-kyc/approve-kyb-kyc.component';
import { ApproveCustomerKycComponent } from './appove-customer-kyc/appove-customer-kyc.component';
import { ApproveKybKycComponent } from './approve-kyb-kyc/approve-kyb-kyc.component';
import { CustomersOverviewComponent } from './customers-overview/customers-overview.component';
import { MerchantOverviewComponent } from './merchant-overview/merchant-overview.component';
import { AdminTransactionsComponent } from './admin-transactions/admin-transactions.component';
import { AdminInstalmentsComponent } from './admin-instalments/admin-instalments.component';
import { AdminCollectionComponent } from './admin-collection/admin-collection.component';
import { SettlementsComponent } from './settlements/settlements.component';
import { ReportsAnalyticsComponent } from './reports-analytics/reports-analytics.component';
import { ProductPlansComponent } from './product-plans/product-plans.component';
import { SystemSettingsComponent } from './system-settings/system-settings.component';
// ✅ CORRECT - Use this instead
import { ToastrModule } from 'ngx-toastr';
import { AdminProfileComponent } from './admin-profile/admin-profile.component';// import { AppoveCustomerKycComponent } from './appove-customer-kyc/appove-customer-kyc.component';
// import { OrdersComponent } from './orders/orders.component';


@NgModule({
  declarations: [
    DashboardComponent,
    LayoutComponent,
    CustomersComponent,
    MerchantsComponent,
    AllUsersComponent,
    TransactionsComponent,
    MerchantDetailsComponent,
    ChargesComponent,
    AdminOrdersComponent,
    ApproveKybKycComponent,
    ApproveCustomerKycComponent,
    CustomersOverviewComponent,
    MerchantOverviewComponent,
    AdminTransactionsComponent,
    AdminInstalmentsComponent,
    AdminCollectionComponent,
    SettlementsComponent,
    ReportsAnalyticsComponent,
    ProductPlansComponent,
    SystemSettingsComponent,
    AdminProfileComponent

  ],
  imports: [
    CommonModule,ReactiveFormsModule,FormsModule,
    RouterModule,DecimalPipe,FormsModule,TitleCasePipe,
    AdminRoutingModule , // ✅ This is correct
       
    // other imports
  ],
  exports: [
    AdminRoutingModule  // ✅ Export this instead of LayoutComponent
    // LayoutComponent  // ❌ No need to export LayoutComponent
  ]
})
export class AdminModule { }