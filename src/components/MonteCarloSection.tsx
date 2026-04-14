import {
  ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import type { MCResult, HistoricalSimLine } from '../lib/types';
import { InfoTooltip } from './InfoTooltip';

interface Props {
  result: MCResult;
  targetAge: number;
  ageFire: number;
  pillarUnlockAge: number;
  ahvUnlockAge: number;
  historicalLines?: HistoricalSimLine[];
}

const fmtChf = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(0)}k`;

export function MonteCarloSection({
  result, targetAge, ageFire, pillarUnlockAge, ahvUnlockAge, historicalLines = [],
}: Props) {
  const { successRate, bands, numSims } = result;

  const chartData = bands.map(b => {
    const entry: Record<string, number> = {
      age: b.age,
      ghost: b.p10,
      q1: Math.max(0, b.p25 - b.p10),
      iqr: Math.max(0, b.p75 - b.p25),
      q3: Math.max(0, b.p90 - b.p75),
      p10ref: b.p10,
      p50: b.p50,
      p90ref: b.p90,
    };
    for (const hl of historicalLines) {
      const pt = hl.portfolioByAge.find(p => p.age === b.age);
      entry[`hist_${hl.id}`] = pt?.value ?? 0;
    }
    return entry;
  });

  const last = bands[bands.length - 1];
  const srColor = successRate >= 0.9 ? 'text-emerald-600' : successRate >= 0.75 ? 'text-amber-600' : 'text-red-600';
  const srBg = successRate >= 0.9 ? 'bg-emerald-50 border-emerald-100' : successRate >= 0.75 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100';

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className={`rounded-xl border p-4 ${srBg}`}>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1 flex items-center">
            Success Rate
            <InfoTooltip text="The percentage of the 500 simulated scenarios where the portfolio is still positive at your target age. 90%+ is considered robust; below 75% suggests significant depletion risk." />
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
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="age" tick={{ fontSize: 11 }}
            label={{ value: 'Age', position: 'insideBottomRight', offset: -4, fontSize: 11 }} />
          <YAxis tickFormatter={fmtChf} tick={{ fontSize: 11 }} width={52} />
          <Tooltip
            formatter={(value, name) => {
              if (typeof value !== 'number') return [value, name];
              const chf = value.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 });
              // Resolve display name for historical lines
              const hl = historicalLines.find(h => `hist_${h.id}` === name);
              return [chf, hl ? hl.label : name];
            }}
            labelFormatter={(label) => `Age ${label}`}
          />

          <ReferenceLine x={pillarUnlockAge} stroke="#8b5cf6" strokeDasharray="4 3"
            label={{ value: '2P', fontSize: 10, fill: '#8b5cf6' }} />
          {ahvUnlockAge > ageFire && (
            <ReferenceLine x={ahvUnlockAge} stroke="#10b981" strokeDasharray="4 3"
              label={{ value: 'AHV', fontSize: 10, fill: '#10b981' }} />
          )}

          {/* Stacked area bands */}
          <Area type="monotone" dataKey="ghost" stackId="mc"
            fill="transparent" stroke="none" legendType="none" />
          <Area type="monotone" dataKey="q1" stackId="mc"
            fill="#fecaca" stroke="none" fillOpacity={0.5} legendType="none" />
          <Area type="monotone" dataKey="iqr" stackId="mc"
            fill="#bfdbfe" stroke="none" fillOpacity={0.6} name="P25–P75" />
          <Area type="monotone" dataKey="q3" stackId="mc"
            fill="#bbf7d0" stroke="none" fillOpacity={0.5} legendType="none" />

          {/* P10, P50, P90 lines */}
          <Line type="monotone" dataKey="p10ref" stroke="#ef4444" strokeWidth={1}
            strokeDasharray="3 2" dot={false} name="P10 (worst 10%)" />
          <Line type="monotone" dataKey="p50" stroke="#3b82f6" strokeWidth={2}
            dot={false} name="Median (P50)" />
          <Line type="monotone" dataKey="p90ref" stroke="#10b981" strokeWidth={1}
            strokeDasharray="3 2" dot={false} name="P90 (best 10%)" />

          {/* Historical sequence lines */}
          {historicalLines.map(hl => (
            <Line
              key={hl.id}
              type="monotone"
              dataKey={`hist_${hl.id}`}
              stroke={hl.color}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              name={hl.label}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
        <span>{numSims} simulations — bands P10/P25/P75/P90</span>
        {historicalLines.map(hl => (
          <span key={hl.id} className="flex items-center gap-1">
            <span className="inline-block w-5 border-t-2 border-dashed" style={{ borderColor: hl.color }} />
            {hl.label}
          </span>
        ))}
      </div>
    </div>
  );
}
