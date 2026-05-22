import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MerchantService } from 'src/app/merchant.service';


@Component({
  selector: 'app-merchant-instalments',
  templateUrl: './merchant-instalments.component.html',
  styleUrls: ['./merchant-instalments.component.scss']
})
export class MerchantInstalmentsComponent implements OnInit {
  isLoading = true;
  instalments: any[] = [];
  filteredInstalments: any[] = [];
  selectedInstalment: any = null;
  selectedStatus = 'all';
  searchTerm = '';
  
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showPaymentModal = false;
  showDetailsModal = false;
  
  createForm: FormGroup;
  editForm: FormGroup;
  paymentForm: FormGroup;
  
  paymentSchedule: any[] = [];

  constructor(
    private merchantService: MerchantService,
    private fb: FormBuilder
  ) {
    this.createForm = this.fb.group({
      plan_name: ['', Validators.required],
      customer_name: ['', Validators.required],
      customer_phone: ['', Validators.required],
      customer_email: ['', Validators.email],
      total_amount: ['', [Validators.required, Validators.min(1)]],
      down_payment: [0, [Validators.min(0)]],
      number_of_installments: ['', [Validators.required, Validators.min(1), Validators.max(24)]],
      installment_amount: ['', [Validators.required, Validators.min(1)]],
      frequency: ['monthly', Validators.required],
      start_date: ['', Validators.required],
      description: ['']
    });
    
    this.editForm = this.fb.group({
      plan_name: ['', Validators.required],
      customer_name: ['', Validators.required],
      customer_phone: ['', Validators.required],
      customer_email: ['', Validators.email],
      description: [''],
      status: ['']
    });
    
    this.paymentForm = this.fb.group({
      installment_number: ['', Validators.required],
      payment_method: ['cash', Validators.required],
      payment_reference: ['']
    });
  }

  ngOnInit(): void {
    this.loadInstalments();
  }

  loadInstalments() {
    this.isLoading = true;
    this.merchantService.getInstalments().subscribe({
      next: (data) => {
        this.instalments = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading instalments:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    let filtered = [...this.instalments];
    
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(i => i.status === this.selectedStatus);
    }

    
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(i => 
        i.plan_id?.toLowerCase().includes(term) ||
        i.plan_name?.toLowerCase().includes(term) ||
        i.customer_name?.toLowerCase().includes(term) ||
        i.customer_phone?.includes(term)
      );
    }
    
    this.filteredInstalments = filtered;
  }

  createInstalment() {
    if (this.createForm.valid) {
      this.merchantService.createInstalmentPlan(this.createForm.value).subscribe({
        next: () => {
          this.loadInstalments();
          this.showCreateModal = false;
          this.createForm.reset();
          alert('Instalment plan created successfully');
        },
        error: (error) => {
          console.error('Error creating instalment:', error);
          alert('Failed to create instalment plan');
        }
      });
    }
  }

  updateInstalment() {
    if (this.editForm.valid && this.selectedInstalment) {
      this.merchantService.updateInstalmentPlan(this.selectedInstalment.id, this.editForm.value).subscribe({
        next: () => {
          this.loadInstalments();
          this.showEditModal = false;
          alert('Instalment plan updated successfully');
        },
        error: (error) => {
          console.error('Error updating instalment:', error);
          alert('Failed to update instalment plan');
        }
      });
    }
  }

  deleteInstalment() {
    if (this.selectedInstalment) {
      this.merchantService.deleteInstalmentPlan(this.selectedInstalment.id).subscribe({
        next: () => {
          this.loadInstalments();
          this.showDeleteModal = false;
          alert('Instalment plan deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting instalment:', error);
          alert('Failed to delete instalment plan');
        }
      });
    }
  }

  recordPayment() {
    if (this.paymentForm.valid && this.selectedInstalment) {
      const data = {
        installment_number: this.paymentForm.value.installment_number,
        payment_method: this.paymentForm.value.payment_method,
        payment_reference: this.paymentForm.value.payment_reference
      };
      this.merchantService.recordInstalmentPayment(this.selectedInstalment.id, data).subscribe({
        next: () => {
          this.loadInstalments();
          this.showPaymentModal = false;
          this.paymentForm.reset();
          alert('Payment recorded successfully');
        },
        error: (error) => {
          console.error('Error recording payment:', error);
          alert('Failed to record payment');
        }
      });
    }
  }

  viewDetails(instalment: any) {
    this.merchantService.getInstalmentDetails(instalment.id).subscribe({
      next: (data) => {
        this.selectedInstalment = data;
        this.paymentSchedule = data.payments || [];
        this.showDetailsModal = true;
      },
      error: (error) => {
        console.error('Error loading details:', error);
        alert('Failed to load instalment details');
      }
    });
  }

  openEditModal(instalment: any) {
    this.selectedInstalment = instalment;
    this.editForm.patchValue({
      plan_name: instalment.plan_name,
      customer_name: instalment.customer_name,
      customer_phone: instalment.customer_phone,
      customer_email: instalment.customer_email,
      description: instalment.description,
      status: instalment.status
    });
    this.showEditModal = true;
  }

  openDeleteModal(instalment: any) {
    this.selectedInstalment = instalment;
    this.showDeleteModal = true;
  }

  openPaymentModal(instalment: any) {
    this.selectedInstalment = instalment;
    this.paymentForm.patchValue({
      installment_number: instalment.paid_installments + 1
    });
    this.showPaymentModal = true;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount || 0);
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'active': return 'status-active';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      case 'overdue': return 'status-overdue';
      default: return 'status-default';
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'active': return '🟢';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      case 'overdue': return '⚠️';
      default: return '📌';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch(status) {
      case 'paid': return 'payment-paid';
      case 'pending': return 'payment-pending';
      case 'overdue': return 'payment-overdue';
      default: return 'payment-default';
    }
  }
}