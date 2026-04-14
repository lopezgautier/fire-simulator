import {
  ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import type { AccumulationRow, DecumulationRow } from '../lib/types';

interface Props {
  accRows: AccumulationRow[];
  decRows: DecumulationRow[];
  fireAge: number;
  pillarUnlockAge: number;
  ahvUnlockAge?: number;
}

const fmtChf = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(0)}k`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl text-xs">
      <p className="text-gray-400 font-medium mb-2">Age {label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        entry.value > 0 && (
          <div key={entry.name} className="flex items-center justify-between gap-6 mb-1">
            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="text-white font-mono tabular-nums">
              {entry.value.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })}
            </span>
          </div>
        )
      ))}
    </div>
  );
}

export function PortfolioChart({ accRows, decRows, fireAge, pillarUnlockAge, ahvUnlockAge }: Props) {
  const accData = accRows.map(r => ({
    age: r.age,
    portfolio: Math.round(r.portfolio),
    pillar: Math.round(r.pillar),
    totalWealth: Math.round(r.totalWealth),
  }));

  const decData = decRows.map(r => ({
    age: r.age,
    portfolio: Math.round(r.portfolioEnd),
    pillar: Math.round(r.lockedPillar),
    totalWealth: Math.round(r.totalWealth),
  }));

  const data = [...accData, ...decData];

  return (
    <div className="rounded-xl overflow-hidden bg-gray-950 p-4">
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradTotalWealth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradPortfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="age"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={{ stroke: '#1e293b' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtChf}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine x={fireAge} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5}
            label={{ value: 'FIRE', fontSize: 10, fill: '#f59e0b', position: 'insideTopLeft' }} />
          <ReferenceLine x={pillarUnlockAge} stroke="#a78bfa" strokeDasharray="4 3" strokeWidth={1.5}
            label={{ value: '2P', fontSize: 10, fill: '#a78bfa', position: 'insideTopLeft' }} />
          {ahvUnlockAge && (
            <ReferenceLine x={ahvUnlockAge} stroke="#34d399" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: 'AHV', fontSize: 10, fill: '#34d399', position: 'insideTopLeft' }} />
          )}

          <Area type="monotone" dataKey="totalWealth" name="Total Wealth"
            fill="url(#gradTotalWealth)" stroke="#3b82f6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="portfolio" name="Portfolio"
            stroke="#60a5fa" strokeWidth={1.5} dot={false} strokeDasharray="none" />
          <Line type="monotone" dataKey="pillar" name="2nd Pillar"
            stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Inline legend */}
      <div className="flex gap-5 mt-3 px-1">
        {[
          { color: '#3b82f6', label: 'Total Wealth', dash: false },
          { color: '#60a5fa', label: 'Portfolio', dash: false },
          { color: '#a78bfa', label: '2nd Pillar', dash: true },
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
      </div>
    </div>
  );
}
