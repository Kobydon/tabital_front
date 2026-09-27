import { Injectable } from '@angular/core';
import {
  HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { notify } from '../shared/notify';
import { AuthService } from './auth.service';

const DEVICE_KEY = 'tabital_device_id';

/** A random id for this browser install, used for fraud checks (CLAUDE.md §9D). Not a fingerprint. */
export function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      id = 'dev-' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

/** Simple signals the browser reports about itself (automation, e.g. Selenium/Puppeteer). */
export function deviceFlags(): string {
  const flags: string[] = [];
  try {
    if ((navigator as any).webdriver) flags.push('webdriver');
  } catch { /* ignore */ }
  return flags.join(',');
}

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private signingOut = false;

  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only our own API gets our token and device headers; never third parties (Paystack, Smile ID)
    if (!req.url.startsWith(environment.apiUrl)) {
      return next.handle(req);
    }

    let headers = req.headers;
    // Always set the session token here. The services build their own header from a key
    // ('access_token') that login never writes, so theirs is "Bearer null" and must be replaced.
    const token = localStorage.getItem('token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    const id = deviceId();
    if (id) headers = headers.set('X-Device-Id', id);
    const flags = deviceFlags();
    if (flags) headers = headers.set('X-Device-Flags', flags);

    return next.handle(req.clone({ headers })).pipe(
      catchError((err: unknown) => {
        // A signed-in request refused because the session expired or the account was suspended:
        // sign out cleanly instead of showing a raw error. (A wrong password at /login is a 401 too,
        // but it's sent without a session.)
        if (err instanceof HttpErrorResponse && err.status === 401 && token && !req.url.endsWith('/login')) {
          this.signOut(err.error?.code === 'account_inactive'
            ? 'Your account isn\'t active any more. Please contact Tabital.'
            : 'Your session has ended. Please sign in again.');
        }
        return throwError(() => err);
      })
    );
  }

  private signOut(message: string): void {
    if (this.signingOut) return;             // several requests can fail at once: one message
    this.signingOut = true;
    AuthService.clearSession();
    notify(message, 'warning');
    this.router.navigate(['/login']).finally(() => { this.signingOut = false; });
  }
}
