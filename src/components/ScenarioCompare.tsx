import type { SavedScenario, AccumulationInputs, DecConfig } from '../lib/types';

const fmt = (n: number) =>
  n.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 });
const pct = (n: number) => (n * 100).toFixed(2) + '%';
const pctSuccess = (n: number) => (n * 100).toFixed(1) + '%';
const lon = (y: number | null) => (y === null ? '50+ yrs' : `${y} yrs`);

export interface CurrentSnapshot {
  accInputs: AccumulationInputs;
  decConfig: DecConfig;
  portfolioAtFire: number;
  pillarAtFire: number;
  totalWealthAtFire: number;
  initialWR: number;
  longevityYears: number | null;
  successRate: number | null;
}

interface Props {
  current: CurrentSnapshot;
  saved: SavedScenario[];
  onLoad: (s: SavedScenario) => void;
  onDelete: (id: number) => void;
}

function SuccessBadge({ rate }: { rate: number }) {
  const color = rate >= 0.9
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : rate >= 0.75
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-red-50 text-red-700 border-red-200';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md border text-xs font-semibold tabular-nums ${color}`}>
      {pctSuccess(rate)}
    </span>
  );
}

export function ScenarioCompare({ current, saved, onLoad, onDelete }: Props) {
  if (saved.length === 0) return null;

  const headers = ['Scenario', 'FIRE Age', 'Portfolio', '2nd Pillar', 'Total Wealth', 'Budget/yr', 'Init. WR', 'Longevity', 'Success', ''];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
        Scenario Comparison
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {headers.map(h => (
                <th key={h} className="pb-2 pr-5 text-right first:text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {/* Current */}
            <tr className="bg-gray-50/80">
              <td className="py-3 pr-5 font-semibold text-gray-800 whitespace-nowrap">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2" />
                Current
              </td>
              <td className="py-3 pr-5 text-right tabular-nums text-gray-700">{current.accInputs.ageFire}</td>
              <td className="py-3 pr-5 text-right tabular-nums text-blue-600 font-medium">{fmt(current.portfolioAtFire)}</td>
              <td className="py-3 pr-5 text-right tabular-nums text-violet-600">{fmt(current.pillarAtFire)}</td>
              <td className="py-3 pr-5 text-right tabular-nums font-semibold text-gray-800">{fmt(current.totalWealthAtFire)}</td>
              <td className="py-3 pr-5 text-right tabular-nums text-gray-600">{fmt(current.decConfig.annualBudget)}</td>
              <td className="py-3 pr-5 text-right tabular-nums text-gray-600">{pct(current.initialWR)}</td>
              <td className="py-3 pr-5 text-right tabular-nums text-gray-600">{lon(current.longevityYears)}</td>
              <td className="py-3 pr-5 text-right">
                {current.successRate !== null ? <SuccessBadge rate={current.successRate} /> : <span className="text-gray-300">—</span>}
              </td>
              <td />
            </tr>

            {saved.map(s => (
              <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="py-3 pr-5 whitespace-nowrap">
                  <span className="inline-block w-2 h-2 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-gray-700">{s.label}</span>
                </td>
                <td className="py-3 pr-5 text-right tabular-nums text-gray-500">{s.accInputs.ageFire}</td>
                <td className="py-3 pr-5 text-right tabular-nums text-gray-500">{fmt(s.portfolioAtFire)}</td>
                <td className="py-3 pr-5 text-right tabular-nums text-gray-500">{fmt(s.pillarAtFire)}</td>
                <td className="py-3 pr-5 text-right tabular-nums text-gray-600 font-medium">{fmt(s.totalWealthAtFire)}</td>
                <td className="py-3 pr-5 text-right tabular-nums text-gray-500">{fmt(s.decConfig.annualBudget)}</td>
                <td className="py-3 pr-5 text-right tabular-nums text-gray-500">{pct(s.initialWR)}</td>
                <td className="py-3 pr-5 text-right tabular-nums text-gray-500">{lon(s.longevityYears)}</td>
                <td className="py-3 pr-5 text-right">
                  {s.successRate !== null ? <SuccessBadge rate={s.successRate} /> : <span className="text-gray-300">—</span>}
                </td>
                <td className="py-3 text-right whitespace-nowrap">
                  <button onClick={() => onLoad(s)} className="text-xs text-blue-500 hover:text-blue-700 mr-3 transition-colors">Load</button>
                  <button onClick={() => onDelete(s.id)} className="text-xs text-gray-300 hover:text-red-400 transition-colors">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
