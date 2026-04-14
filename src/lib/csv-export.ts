import type { AccumulationRow, DecumulationRow } from './types';

function esc(v: string | number): string {
  return `"${String(v).replace(/"/g, '""')}"`;
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map(r => r.map(esc).join(',')).join('\n');
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function accumulationCsv(rows: AccumulationRow[]): string {
  return toCsv([
    ['Year', 'Age', 'Portfolio (CHF)', '2nd Pillar (CHF)', 'Total Wealth (CHF)', 'Cash In (CHF)', 'Gain (CHF)'],
    ...rows.map(r => [
      r.year, r.age,
      Math.round(r.portfolio), Math.round(r.pillar), Math.round(r.totalWealth),
      Math.round(r.totalInvested), Math.round(r.totalGain),
    ]),
  ]);
}

export function decumulationCsv(rows: DecumulationRow[]): string {
  return toCsv([
    ['Year', 'Age', 'Total Budget (CHF)', 'Portfolio Draw (CHF)', 'Locked Pillar (CHF)',
      'Total Wealth (CHF)', 'Portfolio Start (CHF)', 'Portfolio End (CHF)', 'WR %', 'Note'],
    ...rows.map(r => [
      r.year, r.age,
      Math.round(r.totalBudget), Math.round(r.portfolioDraw), Math.round(r.lockedPillar),
      Math.round(r.totalWealth), Math.round(r.portfolioStart), Math.round(r.portfolioEnd),
      (r.withdrawalRate * 100).toFixed(2) + '%', r.note,
    ]),
  ]);
}
