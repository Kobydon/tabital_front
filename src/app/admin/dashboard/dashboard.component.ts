// admin/dashboard/dashboard.component.ts (FIXED)
import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  users: any[] = [];
  loading = false;
  stats = {
    total: 0,
    customers: 0,
    merchants: 0,
    pending: 0,
    approved: 0,
  };

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.adminService.getPendingUsers().subscribe({
      next: (res: any) => {
        this.users = res;
        this.calculateStats();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  calculateStats() {
    this.stats.total = this.users.length;
    this.stats.customers = this.users.filter(u => u.role === 'customer').length;
    this.stats.merchants = this.users.filter(u => u.role === 'merchant').length;
    this.stats.pending = this.users.filter(u => u.status === 'pending').length;
    this.stats.approved = this.users.filter(u => u.status === 'approved').length;
  }

  approve(id: number) {
    this.adminService.approveUser(id).subscribe(() => this.loadUsers());
  }

  reject(id: number) {
    this.adminService.rejectUser(id).subscribe(() => this.loadUsers());
  }
}