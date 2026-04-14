import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
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
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)}M`
    : `${(v / 1_000).toFixed(0)}k`;

export function PortfolioChart({ accRows, decRows, fireAge, pillarUnlockAge, ahvUnlockAge }: Props) {
  const accData = accRows.map(r => ({
    age: r.age,
    portfolio: Math.round(r.portfolio),
    pillar: Math.round(r.pillar),
    totalWealth: Math.round(r.totalWealth),
    phase: 'acc' as const,
  }));

  const decData = decRows.map(r => ({
    age: r.age,
    portfolio: Math.round(r.portfolioEnd),
    pillar: 0,
    totalWealth: Math.round(r.portfolioEnd),
    phase: 'dec' as const,
  }));

  const data = [...accData, ...decData];

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="age"
          tick={{ fontSize: 12 }}
          label={{ value: 'Age', position: 'insideBottomRight', offset: -4, fontSize: 12 }}
        />
        <YAxis
          tickFormatter={fmtChf}
          tick={{ fontSize: 12 }}
          width={56}
        />
        <Tooltip
          formatter={(value) =>
            typeof value === 'number'
              ? value.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })
              : value
          }
          labelFormatter={(label) => `Age ${label}`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />

        <ReferenceLine x={fireAge} stroke="#f59e0b" strokeDasharray="4 3" label={{ value: 'FIRE', fontSize: 11, fill: '#f59e0b' }} />
        <ReferenceLine x={pillarUnlockAge} stroke="#8b5cf6" strokeDasharray="4 3" label={{ value: '2P', fontSize: 11, fill: '#8b5cf6' }} />
        {ahvUnlockAge && (
          <ReferenceLine x={ahvUnlockAge} stroke="#10b981" strokeDasharray="4 3" label={{ value: 'AHV', fontSize: 11, fill: '#10b981' }} />
        )}

        <Area
          type="monotone"
          dataKey="totalWealth"
          name="Total Wealth"
          fill="#dbeafe"
          stroke="#3b82f6"
          strokeWidth={2}
          fillOpacity={0.4}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="portfolio"
          name="Portfolio"
          stroke="#2563eb"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="pillar"
          name="2nd Pillar"
          stroke="#7c3aed"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
