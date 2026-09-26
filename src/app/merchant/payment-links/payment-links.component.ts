import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MerchantService } from 'src/app/merchant.service';

interface PaymentLink {
  id: number;
  token: string;
  url: string;
  status: string;
  usable: boolean;
  product_name: string;
  price: number;
  quantity: number;
  note: string | null;
  expires_at: string;
  created_at: string;
  qr_svg?: string;
}

/** One-use checkout links + QR codes for in-store and WhatsApp sales. */
@Component({
  selector: 'app-payment-links',
  templateUrl: './payment-links.component.html',
  styleUrls: ['../merchant-settlements/merchant-settlements.component.scss', './payment-links.component.scss']
})
export class PaymentLinksComponent implements OnInit {
  links: PaymentLink[] = [];
  products: any[] = [];
  isLoading = false;

  form = { product_id: null as number | null, quantity: 1, note: '', expires_in_hours: 24 };
  readonly expiryOptions = [{ h: 1, label: '1 hour' }, { h: 24, label: '24 hours' }, { h: 72, label: '3 days' }, { h: 168, label: '7 days' }];
  creating = false;
  error = '';

  shown: PaymentLink | null = null;
  qrUrl: SafeUrl | null = null;
  copied = false;

  constructor(private merchantService: MerchantService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadLinks();
    this.merchantService.getMerchantProducts({ status: 'active', limit: 100 }).subscribe({
      next: (res: any) => { this.products = (res.products || []).filter((p: any) => (p.stock_quantity || 0) > 0); }
    });
  }

  loadLinks() {
    this.isLoading = true;
    this.merchantService.getPaymentLinks().subscribe({
      next: (res: any) => { this.links = res.payment_links || []; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  get selectedProduct(): any {
    return this.products.find(p => p.id === Number(this.form.product_id));
  }

  create() {
    if (!this.form.product_id) return;
    this.creating = true;
    this.error = '';
    this.merchantService.createPaymentLink({
      product_id: Number(this.form.product_id),
      quantity: Number(this.form.quantity) || 1,
      note: this.form.note.trim() || undefined,
      expires_in_hours: Number(this.form.expires_in_hours)
    }).subscribe({
      next: (link: PaymentLink) => {
        this.creating = false;
        this.form.note = '';
        this.show(link);
        this.loadLinks();
      },
      error: (err: any) => {
        this.creating = false;
        this.error = err.error?.error || 'Could not create the link';
      }
    });
  }

  open(link: PaymentLink) {
    this.merchantService.getPaymentLink(link.id).subscribe({ next: (full: PaymentLink) => this.show(full) });
  }

  private show(link: PaymentLink) {
    this.shown = link;
    this.copied = false;
    this.qrUrl = link.qr_svg
      ? this.sanitizer.bypassSecurityTrustUrl('data:image/svg+xml;base64,' + btoa(link.qr_svg))
      : null;
  }

  copy(link: PaymentLink) {
    navigator.clipboard?.writeText(link.url).then(() => { this.copied = true; });
  }

  whatsappUrl(link: PaymentLink): string {
    const text = `Buy ${link.product_name} now and pay in instalments with Tabital Pay: ${link.url}`;
    return 'https://wa.me/?text=' + encodeURIComponent(text);
  }

  downloadQr(link: PaymentLink) {
    if (!link.qr_svg) return;
    const url = URL.createObjectURL(new Blob([link.qr_svg], { type: 'image/svg+xml' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `tabital_qr_${link.product_name.replace(/\W+/g, '_')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  cancel(link: PaymentLink) {
    if (!confirm(`Cancel the link for ${link.product_name}? Customers won't be able to use it.`)) return;
    this.merchantService.cancelPaymentLink(link.id).subscribe({
      next: () => {
        if (this.shown?.id === link.id) this.shown = null;
        this.loadLinks();
      }
    });
  }

  statusLabel(link: PaymentLink): string {
    if (link.status === 'active' && !link.usable) return 'Expired';
    return ({ active: 'Active', used: 'Used', cancelled: 'Cancelled' } as any)[link.status] || link.status;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount || 0);
  }

  formatDateTime(date: string): string {
    // API times are UTC without a zone suffix
    const d = new Date(date.endsWith('Z') ? date : date + 'Z');
    return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
