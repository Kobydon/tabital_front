import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// AUTH
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';

// GUARDS
import { AuthGuard } from './auth/auth.guard';
import { GuestGuard } from './auth/guest.guard';

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

  // ===== ADMIN (PROTECTED) =====
  {
    path: 'admin',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./admin/admin.module').then(m => m.AdminModule)
  },

  // ===== MERCHANT (PROTECTED) =====
  {
    path: 'merchant',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./merchant/merchant.module').then(m => m.MerchantModule)
  },

  // ===== DEFAULT =====
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // ===== 404 =====
  { path: '**', redirectTo: '/login' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }