import { Component, OnInit } from '@angular/core';
import { MerchantService } from 'src/app/merchant.service';

interface SettlementBatch {
  id: number;
  settlement_id: string;
  period_start: string | null;
  period_end: string;
  gross: number;
  fees: number;
  clawbacks: number;
  net: number;
  status: string;
  hold_reason: string | null;
  failure_reason: string | null;
  paid_at: string | null;
  lines?: any[];
}

interface PayoutAccount {
  payout_method: string | null;
  payout_bank_code: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  momo_name: string | null;
  momo_number: string | null;
  settlement_period_days: number;
  payout_hold_until: string | null;
  payouts_ready: boolean;
  payouts_blocked_reason: string | null;
}

@Component({
  selector: 'app-merchant-settlements',
  templateUrl: './merchant-settlements.component.html',
  styleUrls: ['./merchant-settlements.component.scss']
})
export class MerchantSettlementsComponent implements OnInit {
  tab: 'settlements' | 'statement' | 'account' = 'settlements';
  readonly periods = [3, 7, 30];

  // Settlements
  isLoading = false;
  batches: SettlementBatch[] = [];
  next = { lines: 0, net: 0, period_days: 7 };
  account: PayoutAccount | null = null;
  selected: SettlementBatch | null = null;

  // Statement
  from = this.isoDate(-30);
  to = this.isoDate(0);
  statement: any = null;
  statementLoading = false;
  statementError = '';

  // Payout account form
  form: any = {};
  banks: { name: string; code: string }[] = [];
  banksError = '';
  saving = false;
  saveMessage = '';
  saveError = '';

  constructor(private merchantService: MerchantService) {}

  ngOnInit(): void {
    this.loadBatches();
  }

  // ------------------------------------------------------------ settlements

  loadBatches() {
    this.isLoading = true;
    this.merchantService.getSettlementBatches().subscribe({
      next: (res: any) => {
        this.batches = res.settlements || [];
        this.next = res.next_settlement || this.next;
        this.setAccount(res.payout_account);
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  viewBatch(batch: SettlementBatch) {
    this.merchantService.getSettlementBatch(batch.id).subscribe({
      next: (res: any) => { this.selected = res; },
      error: () => { this.selected = batch; }
    });
  }

  statusLabel(status: string): string {
    return ({
      pending_approval: 'Awaiting approval',
      on_hold: 'On hold',
      processing: 'Sending',
      paid: 'Paid',
      failed: 'Failed'
    } as any)[status] || status;
  }

  statusClass(status: string): string {
    return ({
      paid: 'status-paid',
      processing: 'status-processing',
      pending_approval: 'status-pending',
      on_hold: 'status-pending',
      failed: 'status-failed'
    } as any)[status] || 'status-default';
  }

  // ------------------------------------------------------------ statement

  loadStatement() {
    this.statementLoading = true;
    this.statementError = '';
    this.merchantService.getStatement(this.from, this.to).subscribe({
      next: (res: any) => { this.statement = res; this.statementLoading = false; },
      error: (err: any) => {
        this.statementError = err.error?.error || 'Could not load the statement';
        this.statementLoading = false;
      }
    });
  }

  downloadCsv() {
    this.merchantService.downloadStatementCsv(this.from, this.to).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tabital_statement_${this.from}_${this.to}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => { this.statementError = 'Could not download the CSV'; }
    });
  }

  // ------------------------------------------------------------ payout account

  openTab(tab: 'settlements' | 'statement' | 'account') {
    this.tab = tab;
    if (tab === 'statement' && !this.statement) this.loadStatement();
    if (tab === 'account') this.loadBanks();
  }

  setAccount(account: PayoutAccount | null) {
    if (!account) return;
    this.account = account;
    this.form = {
      payout_method: account.payout_method || 'mobile_money',
      payout_bank_code: account.payout_bank_code || '',
      bank_name: account.bank_name || '',
      account_name: account.account_name || '',
      account_number: account.account_number || '',
      momo_name: account.momo_name || '',
      momo_number: account.momo_number || '',
      settlement_period_days: account.settlement_period_days || 7
    };
  }

  loadBanks() {
    this.banksError = '';
    this.merchantService.getPayoutBanks(this.form.payout_method || 'mobile_money').subscribe({
      next: (res: any) => { this.banks = res.banks || []; },
      error: (err: any) => {
        this.banks = [];
        this.banksError = err.error?.error || 'Could not load the provider list';
      }
    });
  }

  methodChanged() {
    this.form.payout_bank_code = '';
    this.loadBanks();
  }

  bankChosen() {
    const bank = this.banks.find(b => b.code === this.form.payout_bank_code);
    if (bank && this.form.payout_method === 'bank') this.form.bank_name = bank.name;
  }

  saveAccount() {
    this.saving = true;
    this.saveMessage = '';
    this.saveError = '';
    const f = this.form;
    const body: any = {
      payout_method: f.payout_method,
      payout_bank_code: f.payout_bank_code,
      settlement_period_days: Number(f.settlement_period_days)
    };
    if (f.payout_method === 'bank') {
      Object.assign(body, { bank_name: f.bank_name, account_name: f.account_name, account_number: f.account_number });
    } else {
      Object.assign(body, { momo_name: f.momo_name, momo_number: f.momo_number });
    }
    this.merchantService.updatePayoutAccount(body).subscribe({
      next: (res: any) => {
        this.setAccount(res);
        this.saveMessage = res.message || 'Saved';
        this.saving = false;
      },
      error: (err: any) => {
        this.saveError = err.error?.error || 'Could not save your payout account';
        this.saving = false;
      }
    });
  }

  // ------------------------------------------------------------ helpers

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount || 0);
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private isoDate(offsetDays: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }
}
