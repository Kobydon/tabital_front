import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
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


@NgModule({
  declarations: [
    DashboardComponent,
    LayoutComponent,
    CustomersComponent,
    MerchantsComponent,
    AllUsersComponent,
    TransactionsComponent,
    MerchantDetailsComponent

  ],
  imports: [
    CommonModule,ReactiveFormsModule,FormsModule,
    RouterModule,
    AdminRoutingModule  // ✅ This is correct
  ],
  exports: [
    AdminRoutingModule  // ✅ Export this instead of LayoutComponent
    // LayoutComponent  // ❌ No need to export LayoutComponent
  ]
})
export class AdminModule { }