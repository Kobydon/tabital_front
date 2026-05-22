import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
// import { NgxChartsModule } from '@swimlane/ngx-charts';   


import { MerchantRoutingModule } from './merchant-routing.module';
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
import { ProductComponent } from './product/product.component';
import { MerchantOrdersComponent } from './merchant-order/merchant-order.component';
import { MerchantDocumentComponent } from './merchant-document/merchant-document.component';
// import { MerchantOrderComponent } from './merchant-order/merchant-order.component';


@NgModule({
  declarations: [
    MerchantLayoutComponent,
    MerchantDashboardComponent,
    MerchantTransactionsComponent,
    MerchantInstalmentsComponent,
    MerchantCustomersComponent,
    MerchantSettlementsComponent,
    MerchantDisputesComponent,
    MerchantReportsComponent,
    MerchantSettingsComponent,
    MerchantNotificationsComponent,
    MerchantSupportComponent,
    ProductComponent,
    MerchantOrdersComponent,
    MerchantDocumentComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MerchantRoutingModule,

  ]
})
export class MerchantModule { }