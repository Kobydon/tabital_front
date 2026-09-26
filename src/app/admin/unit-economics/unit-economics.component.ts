import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';

/**
 * Founder reporting (CLAUDE.md §7, §8.4, §11, §12): margin per the full §7 model, portfolio
 * health and liquidity, repayment quality by cohort, and a what-if calculator.
 * Every number comes from the API (ledger based); nothing is calculated here.
 */
@Component({
  selector: 'app-unit-economics',
  templateUrl: './unit-economics.component.html',
  styleUrls: ['../settlements/settlements.component.scss', './unit-economics.component.scss']
})
export class UnitEconomicsComponent implements OnInit {
  tab: 'margin' | 'portfolio' | 'cohorts' | 'scenario' = 'margin';

  from = `${new Date().getFullYear()}-01-01`;
  to = new Date().toISOString().slice(0, 10);
  summary: any = null;
  portfolio: any = null;
  cohorts: any = null;
  scenario: any = null;
  loading = false;
  error = '';

  readonly costKeys = [
    'gateway_fee_percentage', 'expected_credit_loss_percentage', 'fraud_loss_reserve_percentage',
    'collections_cost_percentage', 'cost_of_capital_annual_percentage'
  ];
  readonly costLabels: Record<string, string> = {
    gateway_fee_percentage: 'Gateway cost',
    expected_credit_loss_percentage: 'Expected credit loss',
    fraud_loss_reserve_percentage: 'Fraud loss reserve',
    collections_cost_percentage: 'Collections cost',
    cost_of_capital_annual_percentage: 'Cost of capital'
  };
  readonly bucketLabels: Record<string, string> = {
    current: 'Current', dpd_1_30: '1–30 days late', dpd_31_60: '31–60 days late',
    dpd_61_90: '61–90 days late', dpd_90_plus: '90+ days (charged off)'
  };
  readonly bucketOrder = ['current', 'dpd_1_30', 'dpd_31_60', 'dpd_61_90', 'dpd_90_plus'];

  // What-if inputs (blank rate = use the current setting)
  what: Record<string, any> = {
    price: 4000, n: 4, dp_percentage: '', mdr_percentage: '',
    gateway_fee_percentage: '', expected_credit_loss_percentage: '', fraud_loss_reserve_percentage: '',
    collections_cost_percentage: '', cost_of_capital_annual_percentage: ''
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  open(tab: 'margin' | 'portfolio' | 'cohorts' | 'scenario') {
    this.tab = tab;
    this.error = '';
    if (tab === 'portfolio' && !this.portfolio) this.loadPortfolio();
    if (tab === 'cohorts' && !this.cohorts) this.loadCohorts();
    if (tab === 'scenario' && !this.scenario) this.runScenario();
  }

  loadSummary() {
    this.loading = true;
    this.adminService.getEconomicsSummary(this.from, this.to).subscribe({
      next: (s: any) => { this.summary = s; this.loading = false; },
      error: (e: any) => { this.loading = false; this.error = e.error?.error || 'Could not load the report'; }
    });
  }

  loadPortfolio() {
    this.loading = true;
    this.adminService.getEconomicsPortfolio().subscribe({
      next: (p: any) => { this.portfolio = p; this.loading = false; },
      error: (e: any) => { this.loading = false; this.error = e.error?.error || 'Could not load the portfolio'; }
    });
  }

  loadCohorts() {
    this.loading = true;
    this.adminService.getEconomicsCohorts().subscribe({
      next: (c: any) => { this.cohorts = c; this.loading = false; },
      error: (e: any) => { this.loading = false; this.error = e.error?.error || 'Could not load cohorts'; }
    });
  }

  runScenario() {
    this.error = '';
    this.adminService.getEconomicsScenario(this.what).subscribe({
      next: (s: any) => { this.scenario = s; },
      error: (e: any) => { this.error = e.error?.error || 'Check the numbers'; }
    });
  }

  downloadCsv() {
    this.adminService.downloadEconomicsCsv(this.from, this.to).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tabital_unit_economics_${this.from}_${this.to}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => { this.error = 'Could not download the CSV'; }
    });
  }

  costTotal(costs: any): number {
    return this.costKeys.reduce((sum, k) => sum + (costs?.[k] || 0), 0);
  }

  lineAmount(key: string): number {
    return this.scenario?.lines?.find((l: any) => l.key === key)?.amount || 0;
  }

  lineBasis(key: string): string {
    return this.scenario?.lines?.find((l: any) => l.key === key)?.basis || '';
  }

  money(v: number | null | undefined): string {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(v || 0);
  }

  pct(v: number | null | undefined): string {
    return v === null || v === undefined ? '—' : `${(+v).toFixed(1)}%`;
  }
}
