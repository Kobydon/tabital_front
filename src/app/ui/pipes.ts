import { Pipe, PipeTransform } from '@angular/core';

const GHS = new Intl.NumberFormat('en-GH', {
  style: 'currency', currency: 'GHS', currencyDisplay: 'code',
  minimumFractionDigits: 2, maximumFractionDigits: 2
});

/** GHS 4,000.00 everywhere (CLAUDE.md: ISO code, 2 dp). Unknown values show "—", never 0. */
export function formatMoney(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? GHS.format(n).replace(/\u00a0/g, ' ') : '—';
}

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(value: unknown): string {
    return formatMoney(value);
  }
}

/** Dates as 26 Sep 2026 (or with time). API times without a zone are UTC. */
export function formatTpDate(value: unknown, withTime = false): string {
  if (!value) return '—';
  let d: Date;
  if (value instanceof Date) {
    d = value;
  } else {
    const s = String(value);
    d = new Date(/T\d\d:\d\d/.test(s) && !/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s + 'Z' : s);
  }
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
}

@Pipe({ name: 'tpDate' })
export class TpDatePipe implements PipeTransform {
  transform(value: unknown, mode: 'date' | 'datetime' = 'date'): string {
    return formatTpDate(value, mode === 'datetime');
  }
}
