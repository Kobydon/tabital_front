import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { notify } from 'src/app/shared/notify';

interface TeamMember { id: number; name: string; phone: string; status: string; admin_level: 'management' | 'operations'; }
interface AccessChange { admin_id: number; from: string | null; to: string; by: string | null; reason: string; at: string | null; }

/** Admin team and Management Access (GET/PUT /admin/team). Every change needs a reason and is logged. */
@Component({
  selector: 'app-admin-team',
  templateUrl: './team.component.html'
})
export class TeamComponent implements OnInit {
  admins: TeamMember[] = [];
  history: AccessChange[] = [];
  loading = false;
  error = '';

  editing: TeamMember | null = null;
  newLevel: 'management' | 'operations' = 'operations';
  reason = '';
  saving = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.http.get<{ admins: TeamMember[]; history: AccessChange[] }>(`${environment.apiUrl}/admin/team`).subscribe({
      next: res => { this.admins = res.admins || []; this.history = res.history || []; this.loading = false; },
      error: err => { this.error = err?.error?.error || 'Could not load the team'; this.loading = false; }
    });
  }

  nameOf(id: number): string {
    return this.admins.find(a => a.id === id)?.name || `Admin ${id}`;
  }

  levelLabel(level: string | null): string {
    return level === 'management' ? 'Management' : 'Operations';
  }

  change(member: TeamMember): void {
    this.editing = member;
    this.newLevel = member.admin_level === 'management' ? 'operations' : 'management';
    this.reason = '';
  }

  save(): void {
    if (!this.editing || this.reason.trim().length < 5) return;
    this.saving = true;
    this.http.put(`${environment.apiUrl}/admin/team/${this.editing.id}`,
      { admin_level: this.newLevel, reason: this.reason.trim() }).subscribe({
      next: () => {
        this.saving = false;
        notify(`${this.editing?.name} now has ${this.levelLabel(this.newLevel)} access`, 'success');
        this.editing = null;
        this.load();
      },
      error: err => {
        this.saving = false;
        notify(err?.error?.error || 'Could not change access', 'error');
      }
    });
  }
}
