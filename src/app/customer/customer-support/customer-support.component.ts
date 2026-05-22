// src/app/customer/components/support/support.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from 'src/app/customers.service';

export type StatusType = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';
export type PriorityType = 'all' | 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: number;
  ticket_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: number;
  message: string;
  is_admin: boolean;
  admin_name?: string;
  created_at: string;
}

@Component({
  selector: 'app-customer-support',
  templateUrl: './customer-support.component.html',
  styleUrls: ['./customer-support.component.scss']
})
export class CustomerSupportComponent implements OnInit {
  // Data
  tickets: SupportTicket[] = [];
  filteredTickets: SupportTicket[] = [];
  selectedTicket: SupportTicket | null = null;
  
  // UI State
  isLoading = true;
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;
  activeTab: 'tickets' | 'new' = 'tickets';
  selectedStatus: StatusType = 'all';
  selectedPriority: PriorityType = 'all';
  
  // Modal States
  showTicketModal = false;
  showReplyModal = false;
  
  // Forms
  ticketForm: FormGroup;
  replyForm: FormGroup;
  
  // Search
  searchTerm = '';
  
  // Categories
  categories = [
    { value: 'payment', label: 'Payment Issue', icon: '💰' },
    { value: 'technical', label: 'Technical Problem', icon: '🔧' },
    { value: 'account', label: 'Account Issue', icon: '👤' },
    { value: 'instalment', label: 'Instalment Plan', icon: '📅' },
    { value: 'delivery', label: 'Delivery Issue', icon: '🚚' },
    { value: 'other', label: 'Other', icon: '📝' }
  ];
  
  priorityOptions: { value: PriorityType; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: '#17a2b8' },
    { value: 'medium', label: 'Medium', color: '#ffc107' },
    { value: 'high', label: 'High', color: '#fd7e14' },
    { value: 'urgent', label: 'Urgent', color: '#dc3545' }
  ];
  
  statusOptions: { value: StatusType; label: string }[] = [
    { value: 'all', label: 'All Tickets' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  constructor(
    private customerService: CustomerService,
    private fb: FormBuilder
  ) {
    this.ticketForm = this.fb.group({
      subject: ['', [Validators.required, Validators.minLength(5)]],
      category: ['', Validators.required],
      priority: ['medium', Validators.required],
      message: ['', [Validators.required, Validators.minLength(20)]]
    });
    
    this.replyForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadTickets();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadTickets(): void {
    this.isLoading = true;
    
    this.customerService.getSupportTickets().subscribe({
      next: (response: any) => {
        this.tickets = (response || []).map((t: any) => ({
          id: t.id,
          ticket_id: t.ticket_id,
          subject: t.subject,
          message: t.message,
          status: t.status,
          priority: t.priority,
          category: t.category,
          created_at: t.created_at,
          updated_at: t.updated_at,
          resolved_at: t.resolved_at
        }));
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
        this.tickets = [];
        this.applyFilters();
        this.isLoading = false;
      }
    });
  }

  // ============================================
  // FILTER METHODS
  // ============================================

  applyFilters(): void {
    let filtered = [...this.tickets];
    
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(t => t.status === this.selectedStatus);
    }
    
    if (this.selectedPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === this.selectedPriority);
    }
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.ticket_id.toLowerCase().includes(term) ||
        t.subject.toLowerCase().includes(term) ||
        t.message.toLowerCase().includes(term)
      );
    }
    
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.filteredTickets = filtered.slice(start, end);
  }

  filterByStatus(status: StatusType): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.applyFilters();
  }

  filterByPriority(priority: PriorityType): void {
    this.selectedPriority = priority;
    this.currentPage = 1;
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.selectedPriority = 'all';
    this.currentPage = 1;
    this.applyFilters();
  }

  // ============================================
  // TICKET ACTIONS
  // ============================================

  createTicket(): void {
    if (this.ticketForm.invalid) return;
    
    const ticketData = {
      subject: this.ticketForm.value.subject,
      category: this.ticketForm.value.category,
      priority: this.ticketForm.value.priority,
      message: this.ticketForm.value.message
    };
    
    this.customerService.contactSupport(ticketData).subscribe({
      next: (response) => {
        this.ticketForm.reset();
        this.activeTab = 'tickets';
        this.loadTickets();
        alert('Ticket created successfully!');
      },
      error: (error) => {
        console.error('Error creating ticket:', error);
        alert('Failed to create ticket. Please try again.');
      }
    });
  }

  viewTicketDetails(ticket: SupportTicket): void {
    this.selectedTicket = ticket;
    this.showTicketModal = true;
  }

  openReplyModal(ticket: SupportTicket): void {
    this.selectedTicket = ticket;
    this.replyForm.reset();
    this.showReplyModal = true;
  }

  sendReply(): void {
    if (this.replyForm.invalid || !this.selectedTicket) return;
    
    const replyData = {
      message: this.replyForm.value.message
    };
    
    this.customerService.addTicketReply(this.selectedTicket.id, replyData.message).subscribe({
      next: (response) => {
        this.showReplyModal = false;
        this.replyForm.reset();
        this.loadTickets();
        alert('Reply sent successfully!');
      },
      error: (error) => {
        console.error('Error sending reply:', error);
        alert('Failed to send reply. Please try again.');
      }
    });
  }

  closeTicket(ticket: SupportTicket): void {
    if (confirm('Are you sure you want to close this ticket?')) {
      this.customerService.closeTicket(ticket.id).subscribe({
        next: (response) => {
          this.loadTickets();
          alert('Ticket closed successfully');
        },
        error: (error) => {
          console.error('Error closing ticket:', error);
          alert('Failed to close ticket. Please try again.');
        }
      });
    }
  }

  // ============================================
  // MODAL CONTROLS
  // ============================================

  closeModals(): void {
    this.showTicketModal = false;
    this.showReplyModal = false;
    this.selectedTicket = null;
  }

  // ============================================
  // PAGINATION
  // ============================================

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyFilters();
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'open': return 'status-open';
      case 'in_progress': return 'status-progress';
      case 'resolved': return 'status-resolved';
      case 'closed': return 'status-closed';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'open': return '🟢';
      case 'in_progress': return '🟡';
      case 'resolved': return '✅';
      case 'closed': return '🔴';
      default: return '📋';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'low': return 'priority-low';
      case 'medium': return 'priority-medium';
      case 'high': return 'priority-high';
      case 'urgent': return 'priority-urgent';
      default: return '';
    }
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      payment: '💰',
      technical: '🔧',
      account: '👤',
      instalment: '📅',
      delivery: '🚚',
      other: '📝'
    };
    return icons[category] || '📋';
  }
}