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
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }