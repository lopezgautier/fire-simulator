import type { AccumulationRow, DecumulationRow } from '../lib/types';

const fmt = (n: number) =>
  n.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 });

const pct = (n: number) => (n * 100).toFixed(1) + '%';

interface AccTableProps {
  rows: AccumulationRow[];
}

export function AccumulationTable({ rows }: AccTableProps) {
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <tr>
            {['Year', 'Age', 'Portfolio', '2nd Pillar', 'Total Wealth', 'Cash In', 'Gain'].map(h => (
              <th key={h} className="px-4 py-3 text-right first:text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(r => (
            <tr key={r.year} className="hover:bg-blue-50 transition-colors">
              <td className="px-4 py-2.5 text-gray-500">{r.year}</td>
              <td className="px-4 py-2.5 font-medium text-gray-800">{r.age}</td>
              <td className="px-4 py-2.5 text-right text-blue-700">{fmt(r.portfolio)}</td>
              <td className="px-4 py-2.5 text-right text-purple-600">{fmt(r.pillar)}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{fmt(r.totalWealth)}</td>
              <td className="px-4 py-2.5 text-right text-gray-500">{fmt(r.totalInvested)}</td>
              <td className="px-4 py-2.5 text-right text-emerald-600">{fmt(r.totalGain)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface DecTableProps {
  rows: DecumulationRow[];
}

const noteStyle: Record<string, string> = {
  drawing: 'text-gray-400',
  depleted: 'font-semibold text-red-600',
};

function getNoteStyle(note: string) {
  if (note.includes('depleted')) return 'font-semibold text-red-600';
  if (note.includes('2P') || note.includes('AHV')) return 'font-semibold text-emerald-600';
  return noteStyle['drawing'];
}

export function DecumulationTable({ rows }: DecTableProps) {
  if (!rows.length) return null;
  const hasAhv = rows.some(r => r.totalBudget !== r.portfolioDraw);
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Year</th>
            <th className="px-4 py-3 text-right font-medium">Age</th>
            <th className="px-4 py-3 text-right font-medium">Spend</th>
            {hasAhv && <th className="px-4 py-3 text-right font-medium">Portfolio Draw</th>}
            <th className="px-4 py-3 text-right font-medium">Portfolio Start</th>
            <th className="px-4 py-3 text-right font-medium">Portfolio End</th>
            <th className="px-4 py-3 text-right font-medium">WR %</th>
            <th className="px-4 py-3 text-right font-medium">Note</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(r => (
            <tr key={r.year} className={`hover:bg-blue-50 transition-colors ${r.note.includes('depleted') ? 'bg-red-50' : r.note !== 'drawing' ? 'bg-emerald-50' : ''}`}>
              <td className="px-4 py-2.5 text-gray-500">{r.year}</td>
              <td className="px-4 py-2.5 text-right font-medium text-gray-800">{r.age}</td>
              <td className="px-4 py-2.5 text-right text-orange-600">{fmt(r.totalBudget)}</td>
              {hasAhv && <td className="px-4 py-2.5 text-right text-orange-400">{fmt(r.portfolioDraw)}</td>}
              <td className="px-4 py-2.5 text-right text-blue-700">{fmt(r.portfolioStart)}</td>
              <td className="px-4 py-2.5 text-right text-blue-600">{fmt(r.portfolioEnd)}</td>
              <td className="px-4 py-2.5 text-right font-mono">{pct(r.withdrawalRate)}</td>
              <td className={`px-4 py-2.5 text-right ${getNoteStyle(r.note)}`}>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
