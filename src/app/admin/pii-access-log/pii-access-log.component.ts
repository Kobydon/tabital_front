import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from 'src/environments/environment';

interface Reveal {
  id: number;
  admin: string | null;
  user_id: number;
  user_name: string | null;
  field: string;
  reason: string;
  at: string | null;
}

/** Who revealed which masked personal value, and why (GET /admin/pii/access-log, latest 200). */
@Component({
  selector: 'app-pii-access-log',
  templateUrl: './pii-access-log.component.html'
})
export class PiiAccessLogComponent implements OnInit {
  reveals: Reveal[] = [];
  loading = false;
  error = '';

  readonly labels: Record<string, string> = {
    national_id: 'Ghana Card', phone: 'Phone', momo_number: 'MoMo number',
    account_number: 'Bank account', business_phone: 'Business phone', ref_phone: 'Referee phone'
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.http.get<{ reveals: Reveal[] }>(`${environment.apiUrl}/admin/pii/access-log`).subscribe({
      next: res => { this.reveals = res.reveals || []; this.loading = false; },
      error: err => { this.error = err?.error?.error || 'Could not load the access log'; this.loading = false; }
    });
  }
}
