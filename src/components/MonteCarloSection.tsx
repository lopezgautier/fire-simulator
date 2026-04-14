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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, historicalLines }: any) {
  if (!active || !payload?.length) return null;
  const named = [
    { key: 'p90ref', label: 'P90 (best 10%)', color: '#34d399' },
    { key: 'p50',    label: 'Median (P50)',    color: '#60a5fa' },
    { key: 'p10ref', label: 'P10 (worst 10%)', color: '#f87171' },
    ...(historicalLines ?? []).map((hl: HistoricalSimLine) => ({
      key: `hist_${hl.id}`, label: hl.label, color: hl.color,
    })),
  ];
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl text-xs">
      <p className="text-gray-400 font-medium mb-2">Age {label}</p>
      {named.map(({ key, label: name, color }) => {
        const entry = payload.find((p: { dataKey: string }) => p.dataKey === key);
        if (!entry || entry.value <= 0) return null;
        return (
          <div key={key} className="flex items-center justify-between gap-6 mb-1">
            <span className="flex items-center gap-1.5" style={{ color }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
              {name}
            </span>
            <span className="text-white font-mono tabular-nums">
              {entry.value.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

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
  const srColor = successRate >= 0.9 ? '#34d399' : successRate >= 0.75 ? '#fbbf24' : '#f87171';
  const srLabel = successRate >= 0.9 ? 'On track' : successRate >= 0.75 ? 'Marginal' : 'At risk';

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Success rate — accent card */}
        <div className="rounded-xl bg-gray-950 border border-gray-800 p-4">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1 flex items-center">
            Success Rate
            <InfoTooltip text="The percentage of the 500 simulated scenarios where the portfolio is still positive at your target age. 90%+ is considered robust; below 75% suggests significant depletion risk." />
          </div>
          <div className="text-3xl font-bold tabular-nums" style={{ color: srColor }}>
            {(successRate * 100).toFixed(0)}%
          </div>
          <div className="text-xs mt-0.5 font-medium" style={{ color: srColor }}>{srLabel}</div>
          <div className="text-xs text-gray-600 mt-0.5">portfolio alive at {targetAge}</div>
        </div>

        {[
          { label: `Median at ${targetAge}`, value: last?.p50 ?? 0, color: '#60a5fa' },
          { label: `Best 10% at ${targetAge}`, value: last?.p90 ?? 0, color: '#34d399' },
          { label: `Worst 10% at ${targetAge}`, value: last?.p10 ?? 0, color: '#f87171' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl bg-gray-950 border border-gray-800 p-4">
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</div>
            <div className="text-2xl font-bold tabular-nums" style={{ color }}>{fmtChf(value)}</div>
          </div>
        ))}
      </div>

      {/* Fan chart — dark canvas */}
      <div className="rounded-xl overflow-hidden bg-gray-950 p-4">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradMcIqr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="age" tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#1e293b' }} tickLine={false} />
            <YAxis tickFormatter={fmtChf} tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<CustomTooltip historicalLines={historicalLines} />} />

            <ReferenceLine x={pillarUnlockAge} stroke="#a78bfa" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: '2P', fontSize: 10, fill: '#a78bfa', position: 'insideTopLeft' }} />
            {ahvUnlockAge > ageFire && (
              <ReferenceLine x={ahvUnlockAge} stroke="#34d399" strokeDasharray="4 3" strokeWidth={1.5}
                label={{ value: 'AHV', fontSize: 10, fill: '#34d399', position: 'insideTopLeft' }} />
            )}

            {/* Stacked bands */}
            <Area type="monotone" dataKey="ghost" stackId="mc"
              fill="transparent" stroke="none" legendType="none" />
            <Area type="monotone" dataKey="q1" stackId="mc"
              fill="#7f1d1d" stroke="none" fillOpacity={0.4} legendType="none" />
            <Area type="monotone" dataKey="iqr" stackId="mc"
              fill="url(#gradMcIqr)" stroke="none" legendType="none" />
            <Area type="monotone" dataKey="q3" stackId="mc"
              fill="#14532d" stroke="none" fillOpacity={0.3} legendType="none" />

            {/* P lines */}
            <Line type="monotone" dataKey="p10ref" stroke="#f87171" strokeWidth={1.5}
              strokeDasharray="3 2" dot={false} name="P10" />
            <Line type="monotone" dataKey="p50" stroke="#60a5fa" strokeWidth={2}
              dot={false} name="Median" />
            <Line type="monotone" dataKey="p90ref" stroke="#34d399" strokeWidth={1.5}
              strokeDasharray="3 2" dot={false} name="P90" />

            {/* Historical sequences */}
            {historicalLines.map(hl => (
              <Line key={hl.id} type="monotone" dataKey={`hist_${hl.id}`}
                stroke={hl.color} strokeWidth={1.5} strokeDasharray="5 3"
                dot={false} name={hl.label} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Inline legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 px-1">
          {[
            { color: '#34d399', label: 'P90', dash: true },
            { color: '#60a5fa', label: 'Median', dash: false },
            { color: '#f87171', label: 'P10', dash: true },
            ...historicalLines.map(hl => ({ color: hl.color, label: hl.label, dash: true })),
          ].map(({ color, label, dash }) => (
            <div key={label} className="flex items-center gap-1.5">
              <svg width="20" height="8">
                {dash
                  ? <line x1="0" y1="4" x2="20" y2="4" stroke={color} strokeWidth="1.5" strokeDasharray="4 2" />
                  : <line x1="0" y1="4" x2="20" y2="4" stroke={color} strokeWidth="2" />}
              </svg>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
          <span className="text-xs text-gray-600 ml-auto">{numSims} simulations</span>
        </div>
      </div>
    </div>
  );
}
