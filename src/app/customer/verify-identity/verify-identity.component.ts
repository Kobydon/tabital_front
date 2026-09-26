import { environment } from 'src/environments/environment';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CustomerService } from 'src/app/customers.service';

// Smile ID's selfie + liveness capture component (https://docs.usesmileid.com/, Web SDK)
const SMILE_CAMERA_SCRIPT = 'https://cdn.usesmileid.com/js/v12/smart-camera-web.js';

type Step = 'loading' | 'intro' | 'camera' | 'uploading' | 'waiting' | 'done' | 'error';

/**
 * Identity check (CLAUDE.md §9A): Ghana Card + selfie with liveness, verified by Smile ID.
 * Images go from this page straight to Smile ID using a short-lived token from our backend,
 * which is bound to the customer's Ghana Card and names. They never reach our servers.
 */
@Component({
  selector: 'app-verify-identity',
  templateUrl: './verify-identity.component.html',
  styleUrls: ['./verify-identity.component.scss']
})
export class VerifyIdentityComponent implements OnInit, OnDestroy {
  /** Terms, privacy and agreement links (environment.legal, §10). */
  readonly legal = environment.legal;

  step: Step = 'loading';
  status: any = null;
  consent = false;
  error = '';
  private session: any = null;
  private poll: any = null;

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    clearInterval(this.poll);
  }

  load() {
    this.customerService.getIdentityStatus().subscribe({
      next: (s: any) => {
        this.status = s;
        const check = s.check?.status;
        if (s.kyc_status === 'verified') this.step = 'done';
        else if (check === 'submitted' || check === 'review') this.startPolling();
        else this.step = 'intro';
      },
      error: () => { this.step = 'error'; this.error = 'Could not load your verification status.'; }
    });
  }

  get checkStatus(): string | null {
    return this.status?.check?.status || null;
  }

  begin() {
    if (!this.consent) return;
    this.error = '';
    this.customerService.startIdentityCheck(true).subscribe({
      next: (session: any) => {
        this.session = session;
        this.loadCamera().then(
          () => { this.step = 'camera'; },
          () => { this.error = 'The camera component could not load. Check your connection and try again.'; }
        );
      },
      error: (err: any) => { this.error = err.error?.error || 'Could not start the check. Please try again.'; }
    });
  }

  private loadCamera(): Promise<void> {
    if (customElements.get('smart-camera-web')) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SMILE_CAMERA_SCRIPT;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject();
      document.body.appendChild(s);
    });
  }

  /** Smile ID's component publishes the captured images: selfie (type 2) and liveness frames (type 6). */
  @HostListener('window:smart-camera-web.publish', ['$event'])
  async onCaptured(event: any) {
    if (this.step !== 'camera' || !this.session) return;
    const images: any[] = event?.detail?.images || [];
    const selfie = images.find(i => i.image_type_id === 2);
    const liveness = images.filter(i => i.image_type_id === 6);
    if (!selfie || liveness.length === 0) {
      this.error = 'We could not capture a clear selfie. Please try again.';
      return;
    }
    this.step = 'uploading';
    const s = this.session;
    const body = new FormData();
    body.append('selfie_image', this.toJpeg(selfie.image, 'selfie.jpg'));
    liveness.forEach((f, i) => body.append('liveness_images', this.toJpeg(f.image, `liveness-${i}.jpg`)));
    // The same details the token was minted with
    Object.entries(s.fields).forEach(([k, v]) => body.append(k, String(v)));
    body.append('consent', JSON.stringify(s.consent));
    body.append('user_details', JSON.stringify({
      given_names: s.fields.given_names, last_name: s.fields.last_name, phone_number: s.fields.phone_number
    }));
    try {
      const res = await fetch(s.submit_url, {
        method: 'POST',
        headers: { 'smileid-token': s.token, Accept: 'application/json' },
        body
      });
      const data = await res.json().catch(() => ({}));
      if (res.status !== 202 || !data.job_id) {
        throw new Error(data.message || data.error || 'Upload failed');
      }
      this.customerService.reportIdentitySubmitted(s.check_id, data.job_id).subscribe({
        next: () => this.startPolling(),
        error: () => this.startPolling()
      });
    } catch (e: any) {
      this.step = 'intro';
      this.error = `We couldn't send your selfie: ${e?.message || 'please try again'}.`;
    }
  }

  private startPolling() {
    this.step = 'waiting';
    clearInterval(this.poll);
    let tries = 0;
    this.poll = setInterval(() => {
      tries++;
      this.customerService.getIdentityStatus().subscribe({
        next: (s: any) => {
          this.status = s;
          const check = s.check?.status;
          if (s.kyc_status === 'verified') { this.step = 'done'; clearInterval(this.poll); }
          else if (check === 'blocked' || check === 'error') { this.step = 'intro'; clearInterval(this.poll); }
          else if (check === 'review') { clearInterval(this.poll); }
        }
      });
      if (tries > 60) clearInterval(this.poll);          // stop after ~10 minutes; the page can be reopened
    }, 10000);
  }

  private toJpeg(base64: string, name: string): File {
    const bytes = atob(String(base64).split(',').pop() || '');
    const buffer = Uint8Array.from(bytes, c => c.charCodeAt(0));
    return new File([buffer], name, { type: 'image/jpeg' });
  }
}
