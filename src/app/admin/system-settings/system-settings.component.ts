import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';

interface SettingRow {
  key: string;
  group: string;
  label: string;
  kind: 'percent' | 'money' | 'integer' | 'days' | 'hours' | 'boolean' | 'text' | 'day_list';
  default: any;
  help: string;
  applies: string;
  min: number | null;
  max: number | null;
  ref: string | null;
  value: any;
  is_default: boolean;
  updated_at: string | null;
  updated_by: string | null;
}

interface SettingGroup { key: string; label: string; settings: SettingRow[]; }

/**
 * Business settings (CLAUDE.md §5.4: every rate is configurable). The server holds the list of
 * editable settings, validates each change, requires a reason and keeps an audit log.
 */
@Component({
  selector: 'app-system-settings',
  templateUrl: './system-settings.component.html',
  styleUrls: ['../settlements/settlements.component.scss', './system-settings.component.scss']
})
export class SystemSettingsComponent implements OnInit {
  tab: 'settings' | 'history' = 'settings';
  groups: SettingGroup[] = [];
  draft: Record<string, any> = {};        // what the inputs show; day lists as "0, 1, 3" text
  errors: Record<string, string> = {};
  history: any[] = [];
  loading = true;
  loadError = '';
  reviewing = false;
  reason = '';
  saving = false;
  message = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.adminService.getBusinessSettings().subscribe({
      next: (res: any) => this.setGroups(res.groups || []),
      error: (e: any) => { this.loading = false; this.loadError = e.error?.error || 'Could not load the settings'; }
    });
  }

  private setGroups(groups: SettingGroup[]) {
    this.groups = groups;
    this.draft = {};
    for (const g of groups) for (const s of g.settings) this.draft[s.key] = this.toInput(s, s.value);
    this.loading = false;
  }

  openHistory() {
    this.tab = 'history';
    this.adminService.getBusinessSettingsHistory().subscribe({ next: (res: any) => { this.history = res.changes || []; } });
  }

  private toInput(s: SettingRow, value: any): any {
    return s.kind === 'day_list' ? (value || []).join(', ') : value;
  }

  /** The value the server would receive for this input. */
  private fromInput(s: SettingRow, input: any): any {
    if (s.kind === 'day_list') {
      return String(input ?? '').split(',').map(x => x.trim()).filter(x => x !== '').map(Number);
    }
    if (s.kind === 'boolean' || s.kind === 'text') return input;
    return input === '' || input === null ? null : Number(input);
  }

  private same(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  isChanged(s: SettingRow): boolean {
    return !this.same(this.fromInput(s, this.draft[s.key]), s.value);
  }

  get changedRows(): SettingRow[] {
    return this.groups.flatMap(g => g.settings).filter(s => this.isChanged(s));
  }

  resetToDefault(s: SettingRow) {
    this.draft[s.key] = this.toInput(s, s.default);
  }

  undo(s: SettingRow) {
    this.draft[s.key] = this.toInput(s, s.value);
    delete this.errors[s.key];
  }

  discardAll() {
    for (const s of this.changedRows) this.undo(s);
    this.reviewing = false;
  }

  review() {
    this.message = '';
    this.reason = '';
    this.reviewing = true;
  }

  save() {
    const changes: Record<string, any> = {};
    for (const s of this.changedRows) changes[s.key] = this.fromInput(s, this.draft[s.key]);
    this.saving = true;
    this.errors = {};
    this.adminService.saveBusinessSettings(changes, this.reason).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.reviewing = false;
        const n = (res.saved || []).length;
        this.message = n ? `Saved ${n} change${n === 1 ? '' : 's'}.` : 'Nothing changed.';
        this.setGroups(res.groups || []);
      },
      error: (e: any) => {
        this.saving = false;
        this.errors = e.error?.errors || { general: e.error?.error || 'Could not save' };
        if (!this.errors['reason']) this.reviewing = false;     // show field errors on the page
      }
    });
  }

  unit(s: SettingRow): string {
    return ({ percent: '%', money: 'GHS', days: 'days', hours: 'hours' } as any)[s.kind] || '';
  }

  show(s: SettingRow, value: any): string {
    if (s.kind === 'boolean') return value ? 'On' : 'Off';
    if (s.kind === 'day_list') return (value || []).length ? (value as number[]).map(d => d === 0 ? 'due date' : `+${d}`).join(', ') : '—';
    if (s.kind === 'money') return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', currencyDisplay: 'code' }).format(value ?? 0);
    if (s.kind === 'percent') return `${value}%`;
    if (s.kind === 'days') return `${value} day${value === 1 ? '' : 's'}`;
    if (s.kind === 'hours') return `${value} hour${value === 1 ? '' : 's'}`;
    return String(value ?? '');
  }

  showInput(s: SettingRow): string {
    return this.show(s, this.fromInput(s, this.draft[s.key]));
  }

  formatDate(d: string | null): string {
    if (!d) return '';
    return new Date(d.endsWith('Z') ? d : d + 'Z').toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  labelFor(key: string): string {
    return this.groups.flatMap(g => g.settings).find(s => s.key === key)?.label || key;
  }

  errorKeys(): string[] {
    return Object.keys(this.errors).filter(k => k !== 'reason');
  }
}
