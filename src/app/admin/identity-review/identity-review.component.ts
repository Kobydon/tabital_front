import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';

/** Smile ID checks that need a person: "attention" results, name/DOB mismatches, and blocks to override. */
@Component({
  selector: 'app-identity-review',
  templateUrl: './identity-review.component.html',
  styleUrls: ['../settlements/settlements.component.scss']
})
export class IdentityReviewComponent implements OnInit {
  readonly filters = [
    { value: 'review', label: 'Needs review' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'submitted', label: 'Waiting for Smile ID' },
    { value: 'clear', label: 'Verified' },
    { value: '', label: 'All' }
  ];
  status = 'review';
  checks: any[] = [];
  configured = true;
  required = true;
  isLoading = false;
  selected: any = null;
  note = '';
  busy = false;
  message = '';
  error = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.isLoading = true;
    this.adminService.getIdentityChecks(this.status).subscribe({
      next: (res: any) => {
        this.checks = res.checks || [];
        this.configured = res.smileid_configured;
        this.required = res.biometric_required;
        this.isLoading = false;
      },
      error: (err: any) => { this.isLoading = false; this.error = err.error?.error || 'Could not load checks'; }
    });
  }

  setFilter(value: string) {
    this.status = value;
    this.load();
  }

  open(check: any) {
    this.selected = check;
    this.note = '';
    this.error = '';
  }

  canDecide(check: any): boolean {
    return ['review', 'blocked', 'error'].includes(check?.status);
  }

  decide(approve: boolean) {
    if (!this.selected || this.note.trim().length < 5) {
      this.error = 'Add a note explaining the decision (at least 5 characters).';
      return;
    }
    this.busy = true;
    this.error = '';
    this.adminService.decideIdentityCheck(this.selected.id, approve, this.note.trim()).subscribe({
      next: () => {
        this.busy = false;
        this.message = approve ? 'Customer verified.' : 'Check rejected.';
        this.selected = null;
        this.load();
      },
      error: (err: any) => { this.busy = false; this.error = err.error?.error || 'Could not save the decision'; }
    });
  }

  match(value: boolean | null): string {
    return value === true ? '✅ Match' : value === false ? '❌ Mismatch' : '—';
  }

  statusClass(status: string): string {
    return ({ clear: 'status-paid', blocked: 'status-failed', submitted: 'status-processing' } as any)[status] || 'status-pending';
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
