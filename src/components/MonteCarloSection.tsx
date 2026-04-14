import {
  ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import type { MCResult } from '../lib/types';

interface Props {
  result: MCResult;
  targetAge: number;
  ageFire: number;
  pillarUnlockAge: number;
  ahvUnlockAge: number;
}

const fmtChf = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(0)}k`;

export function MonteCarloSection({ result, targetAge, ageFire, pillarUnlockAge, ahvUnlockAge }: Props) {
  const { successRate, bands, numSims } = result;

  // Transform bands into stacked-area format:
  // ghost (transparent) sits from 0 → p10, then each colored band stacks on top.
  const chartData = bands.map(b => ({
    age: b.age,
    ghost: b.p10,
    q1: Math.max(0, b.p25 - b.p10),    // P10–P25: red tint
    iqr: Math.max(0, b.p75 - b.p25),   // P25–P75: blue tint
    q3: Math.max(0, b.p90 - b.p75),    // P75–P90: green tint
    // Absolute reference lines (not stacked)
    p10ref: b.p10,
    p50: b.p50,
    p90ref: b.p90,
  }));

  const last = bands[bands.length - 1];
  const srColor = successRate >= 0.9 ? 'text-emerald-600' : successRate >= 0.75 ? 'text-amber-600' : 'text-red-600';
  const srBg = successRate >= 0.9 ? 'bg-emerald-50 border-emerald-100' : successRate >= 0.75 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100';

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className={`rounded-xl border p-4 ${srBg}`}>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
            Success Rate
          </div>
          <div className={`text-2xl font-bold ${srColor}`}>
            {(successRate * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-400 mt-0.5">portfolio alive at {targetAge}</div>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Median at {targetAge}</div>
          <div className="text-lg font-bold text-blue-700">{fmtChf(last?.p50 ?? 0)}</div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Best 10% at {targetAge}</div>
          <div className="text-lg font-bold text-emerald-700">{fmtChf(last?.p90 ?? 0)}</div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Worst 10% at {targetAge}</div>
          <div className="text-lg font-bold text-red-700">{fmtChf(last?.p10 ?? 0)}</div>
        </div>
      </div>

      {/* Fan chart */}
      <p className="text-xs text-gray-400">
        {numSims} simulations — shaded bands show P10/P25/P75/P90 outcome range
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="age" tick={{ fontSize: 11 }}
            label={{ value: 'Age', position: 'insideBottomRight', offset: -4, fontSize: 11 }} />
          <YAxis tickFormatter={fmtChf} tick={{ fontSize: 11 }} width={52} />
          <Tooltip
            formatter={(value) =>
              typeof value === 'number'
                ? value.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })
                : value
            }
            labelFormatter={(label) => `Age ${label}`}
          />

          <ReferenceLine x={pillarUnlockAge} stroke="#8b5cf6" strokeDasharray="4 3"
            label={{ value: '2P', fontSize: 10, fill: '#8b5cf6' }} />
          {ahvUnlockAge > ageFire && (
            <ReferenceLine x={ahvUnlockAge} stroke="#10b981" strokeDasharray="4 3"
              label={{ value: 'AHV', fontSize: 10, fill: '#10b981' }} />
          )}

          {/* Stacked area bands — ghost is transparent to push bands up to p10 */}
          <Area type="monotone" dataKey="ghost" stackId="mc"
            fill="transparent" stroke="none" legendType="none" />
          <Area type="monotone" dataKey="q1" stackId="mc"
            fill="#fecaca" stroke="none" fillOpacity={0.5} legendType="none" />
          <Area type="monotone" dataKey="iqr" stackId="mc"
            fill="#bfdbfe" stroke="none" fillOpacity={0.6} name="P25–P75" />
          <Area type="monotone" dataKey="q3" stackId="mc"
            fill="#bbf7d0" stroke="none" fillOpacity={0.5} legendType="none" />

          {/* P10, P50, P90 reference lines */}
          <Line type="monotone" dataKey="p10ref" stroke="#ef4444" strokeWidth={1}
            strokeDasharray="3 2" dot={false} name="P10 (worst 10%)" />
          <Line type="monotone" dataKey="p50" stroke="#3b82f6" strokeWidth={2}
            dot={false} name="Median (P50)" />
          <Line type="monotone" dataKey="p90ref" stroke="#10b981" strokeWidth={1}
            strokeDasharray="3 2" dot={false} name="P90 (best 10%)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
