import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Components
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { AuthInterceptor } from './auth/auth';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { AdminModule } from './admin/admin.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // ✅ Add this
// Interceptors - FIXED PATH (added .interceptor)


// Services (optional - if using providedIn: 'root')
// import { AuthService } from './auth/auth.service';

// Modules
// ❌ DO NOT import AdminModule here if using lazy loading
// import { AdminModule } from './admin/admin.module';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    ForgotPasswordComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,      // This handles routing (including lazy loading)
    HttpClientModule,
    ReactiveFormsModule,
        BrowserAnimationsModule, 
    FormsModule,
    // ❌ REMOVE AdminModule from here for lazy loading
    // AdminModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }