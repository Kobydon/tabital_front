import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface User {
  id: number;
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  kyc_status: string;
  verification_level: string;
  city: string;
  created_at: string;
  total_financed: number;
  active_plans: number;
}

@Component({
  selector: 'app-all-users',
  templateUrl: './all-users.component.html',
  styleUrls: ['./all-users.component.scss']
})
export class AllUsersComponent implements OnInit {
  // Data
  users: User[] = [];
  selectedUser: any = null;
  userStats: any = {};
  
  // UI State
  isLoading = true;
  showUserModal = false;
  showUpdateStatusModal = false;
  showDeleteConfirmModal = false;
  isSubmitting = false;
  
  // Filters
  searchTerm = '';
  selectedRole = '';
  selectedStatus = '';
  selectedKYCStatus = '';
  sortBy = 'created_at';
  sortOrder = 'desc';
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 1;
  
  // Forms
  updateStatusForm: FormGroup;
  
  // Math for template
  Math = Math;
  
  // Stats Cards
  statsCards = [
    { label: 'Total Users', value: 0, icon: '👥', color: 'blue', isCurrency: false },
    { label: 'Customers', value: 0, icon: '👤', color: 'green', isCurrency: false },
    { label: 'Merchants', value: 0, icon: '🏪', color: 'purple', isCurrency: false },
    { label: 'Active', value: 0, icon: '✅', color: 'green', isCurrency: false },
    { label: 'Pending', value: 0, icon: '⏳', color: 'orange', isCurrency: false },
    { label: 'Suspended', value: 0, icon: '🚫', color: 'red', isCurrency: false },
    { label: 'KYC Verified', value: 0, icon: '✓', color: 'teal', isCurrency: false },
    { label: 'New (30 Days)', value: 0, icon: '🆕', color: 'purple', isCurrency: false }
  ];

  // Role Options
  roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'customer', label: 'Customer' },
    { value: 'merchant', label: 'Merchant' }
  ];

  // Status Options
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'approved', label: 'Approved' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'restricted', label: 'Restricted' }
  ];

  // KYC Status Options
  kycStatusOptions = [
    { value: '', label: 'All KYC Status' },
    { value: 'verified', label: 'Verified' },
    { value: 'pending', label: 'Pending' },
    { value: 'rejected', label: 'Rejected' }
  ];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.updateStatusForm = this.fb.group({
      status: ['', Validators.required],
      reason: ['']
    });
  }

  ngOnInit(): void {
    this.loadUserStats();
    this.loadUsers();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadUserStats(): void {
    this.adminService.getUserStats().subscribe({
      next: (response: any) => {
        console.log('User stats:', response);
        this.userStats = response;
        this.updateStatsCards();
      },
      error: (error) => {
        console.error('Error loading user stats:', error);
      }
    });
  }

  updateStatsCards(): void {
    this.statsCards[0].value = this.userStats.total_users || 0;
    this.statsCards[1].value = this.userStats.total_customers || 0;
    this.statsCards[2].value = this.userStats.total_merchants || 0;
    this.statsCards[3].value = this.userStats.active_users || 0;
    this.statsCards[4].value = this.userStats.pending_users || 0;
    this.statsCards[5].value = this.userStats.suspended_users || 0;
    this.statsCards[6].value = this.userStats.kyc_verified || 0;
    this.statsCards[7].value = this.userStats.new_users || 0;
  }

  loadUsers(): void {
    this.isLoading = true;
    
    const filters: any = {
      page: this.currentPage,
      per_page: this.pageSize,
      search: this.searchTerm,
      role: this.selectedRole,
      status: this.selectedStatus,
      kyc_status: this.selectedKYCStatus,
      sort_by: this.sortBy,
      sort_order: this.sortOrder
    };
    
    this.adminService.getAllUsers(filters).subscribe({
      next: (response: any) => {
        console.log('Users response:', response);
        if (Array.isArray(response)) {
          this.users = response;
          this.totalItems = response.length;
          this.totalPages = 1;
        } else {
          this.users = response.users || [];
          this.totalItems = response.total || 0;
          this.totalPages = response.total_pages || 1;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
      }
    });
  }

  // ============================================
  // USER DETAILS
  // ============================================

  viewUserDetails(user: User): void {
    this.adminService.getUserDetail(user.id).subscribe({
      next: (response: any) => {
        this.selectedUser = response;
        this.showUserModal = true;
      },
      error: (error) => {
        console.error('Error loading user details:', error);
        alert('Failed to load user details');
      }
    });
  }

  // ============================================
  // USER ACTIONS
  // ============================================

  openUpdateStatusModal(user: User): void {
    this.selectedUser = { user };
    this.updateStatusForm.patchValue({ status: user.status, reason: '' });
    this.showUpdateStatusModal = true;
  }

  updateUserStatus(): void {
    if (this.updateStatusForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.updateStatusForm.value;
    
    this.adminService.updateUserStatus(this.selectedUser.user.id, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('User status updated successfully');
        this.showUpdateStatusModal = false;
        this.loadUsers();
        this.loadUserStats();
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.isSubmitting = false;
        alert('Failed to update user status');
      }
    });
  }

  openDeleteConfirmModal(user: User): void {
    this.selectedUser = { user };
    this.showDeleteConfirmModal = true;
  }

  deleteUser(): void {
    this.isSubmitting = true;
    
    this.adminService.deleteUser(this.selectedUser.user.id).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        alert('User deactivated successfully');
        this.showDeleteConfirmModal = false;
        this.loadUsers();
        this.loadUserStats();
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.isSubmitting = false;
        alert('Failed to deactivate user');
      }
    });
  }

  exportUsers(): void {
    const filters: any = {
      role: this.selectedRole,
      status: this.selectedStatus
    };
    
    this.adminService.exportUsers(filters).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        alert('Users exported successfully!');
      },
      error: (error) => {
        console.error('Error exporting users:', error);
        alert('Failed to export users');
      }
    });
  }

  // ============================================
  // FILTERS & SORTING
  // ============================================

  applyFilters(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.selectedKYCStatus = '';
    this.sortBy = 'created_at';
    this.sortOrder = 'desc';
    this.currentPage = 1;
    this.loadUsers();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'desc';
    }
    this.loadUsers();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadUsers();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  getRoleClass(role: string): string {
    switch(role?.toLowerCase()) {
      case 'customer': return 'role-customer';
      case 'merchant': return 'role-merchant';
      default: return '';
    }
  }

  getStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'approved':
      case 'active': return 'status-active';
      case 'pending': return 'status-pending';
      case 'suspended': return 'status-suspended';
      case 'restricted': return 'status-restricted';
      default: return '';
    }
  }

  getKYCStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'verified': return 'kyc-verified';
      case 'pending': return 'kyc-pending';
      case 'rejected': return 'kyc-rejected';
      default: return '';
    }
  }

  formatCurrency(amount: number): string {
    if (!amount && amount !== 0) return 'GHS 0.00';
    return new Intl.NumberFormat('en-GH', { 
      style: 'currency', 
      currency: 'GHS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatNumber(num: number): string {
    if (!num) return '0';
    return num.toLocaleString();
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  closeModals(): void {
    this.showUserModal = false;
    this.showUpdateStatusModal = false;
    this.showDeleteConfirmModal = false;
    this.selectedUser = null;
    this.isSubmitting = false;
  }
}