// ============================================
// app-routing.module.ts - ADD DEBUGGING
// ============================================

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// AUTH
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';

// GUARDS
import { AuthGuard } from './auth/auth.guard';
import { GuestGuard } from './auth/guest.guard';
import { RoleGuard } from './role.guard';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';

const routes: Routes = [

  // ===== AUTH (ONLY FOR NON-LOGGED USERS) =====
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [GuestGuard]
  },
  {
    path: 'signup',
    component: SignupComponent,
    canActivate: [GuestGuard]
  },

   {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [GuestGuard]
  },

  // ===== ADMIN (PROTECTED WITH ROLE) =====
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' },
    loadChildren: () => {
      return import('./admin/admin.module').then(m => {
        return m.AdminModule;
      });
    }
  },

  // ===== MERCHANT (PROTECTED WITH ROLE) =====
  {
    path: 'merchant',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'merchant' },
    loadChildren: () => {
      return import('./merchant/merchant.module').then(m => {
        return m.MerchantModule;
      });
    }
  },

  // ===== CUSTOMER (PROTECTED WITH ROLE) =====
  {
    path: 'customer',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'customer' },
    loadChildren: () => {
      return import('./customer/customer.module').then(m => {
        return m.CustomerModule;
      });
    }
  },

  // ===== DEFAULT =====
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // ===== 404 =====
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false,
    useHash: false
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }