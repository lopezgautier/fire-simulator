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

export function ScenarioCompare({ current, saved, onLoad, onDelete }: Props) {
  if (saved.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Scenario Comparison
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
            <tr>
              {['Scenario', 'FIRE Age', 'Portfolio', '2nd Pillar', 'Total Wealth', 'Budget/yr', 'Init. WR', 'Longevity', 'Success', ''].map(h => (
                <th key={h} className="pb-2 pr-4 text-right first:text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {/* Current — always first row */}
            <tr className="bg-blue-50/60">
              <td className="py-3 pr-4 font-semibold text-blue-700 whitespace-nowrap">Current</td>
              <td className="py-3 pr-4 text-right">{current.accInputs.ageFire}</td>
              <td className="py-3 pr-4 text-right text-blue-700">{fmt(current.portfolioAtFire)}</td>
              <td className="py-3 pr-4 text-right text-purple-600">{fmt(current.pillarAtFire)}</td>
              <td className="py-3 pr-4 text-right font-semibold">{fmt(current.totalWealthAtFire)}</td>
              <td className="py-3 pr-4 text-right">{fmt(current.decConfig.annualBudget)}</td>
              <td className="py-3 pr-4 text-right">{pct(current.initialWR)}</td>
              <td className="py-3 pr-4 text-right">{lon(current.longevityYears)}</td>
              <td className="py-3 pr-4 text-right">
                {current.successRate !== null ? (
                  <span className={`font-semibold ${current.successRate >= 0.9 ? 'text-emerald-600' : current.successRate >= 0.75 ? 'text-amber-600' : 'text-red-600'}`}>
                    {pctSuccess(current.successRate)}
                  </span>
                ) : '—'}
              </td>
              <td />
            </tr>

            {/* Saved scenarios */}
            {saved.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 pr-4 whitespace-nowrap">
                  <span className="inline-block w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-gray-700">{s.label}</span>
                </td>
                <td className="py-3 pr-4 text-right text-gray-600">{s.accInputs.ageFire}</td>
                <td className="py-3 pr-4 text-right text-gray-600">{fmt(s.portfolioAtFire)}</td>
                <td className="py-3 pr-4 text-right text-gray-600">{fmt(s.pillarAtFire)}</td>
                <td className="py-3 pr-4 text-right text-gray-600">{fmt(s.totalWealthAtFire)}</td>
                <td className="py-3 pr-4 text-right text-gray-600">{fmt(s.decConfig.annualBudget)}</td>
                <td className="py-3 pr-4 text-right text-gray-600">{pct(s.initialWR)}</td>
                <td className="py-3 pr-4 text-right text-gray-600">{lon(s.longevityYears)}</td>
                <td className="py-3 pr-4 text-right">
                  {s.successRate !== null ? (
                    <span className={`font-semibold ${s.successRate >= 0.9 ? 'text-emerald-600' : s.successRate >= 0.75 ? 'text-amber-600' : 'text-red-600'}`}>
                      {pctSuccess(s.successRate)}
                    </span>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="py-3 text-right whitespace-nowrap">
                  <button onClick={() => onLoad(s)} className="text-xs text-blue-500 hover:text-blue-700 mr-3">
                    Load
                  </button>
                  <button onClick={() => onDelete(s.id)} className="text-xs text-gray-300 hover:text-red-400">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
