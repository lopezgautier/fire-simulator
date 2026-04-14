import { useState } from 'react';
import type { AccumulationResult, AccumulationInputs, DecumulationInputs } from '../lib/types';
import { simulateDecumulation } from '../lib/simulate-decumulation';
import { InputField } from './InputField';
import { DecumulationTable } from './YearTable';

const fmt = (n: number) =>
  n.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 });
const pct = (n: number) => (n * 100).toFixed(1) + '%';

interface Props {
  accResult: AccumulationResult;
  accInputs: AccumulationInputs;
}

export function DecumulationPanel({ accResult, accInputs }: Props) {
  const [annualBudget, setAnnualBudget] = useState(80_000);
  const [returnRate, setReturnRate] = useState(0.04);
  const [inflationRate, setInflationRate] = useState(0.02);
  const [inflationAdjust, setInflationAdjust] = useState(false);
  const [flatMode, setFlatMode] = useState(false);
  const [ahvAnnual, setAhvAnnual] = useState(0);

  const pillarUnlockYear = accInputs.ageRetirement - accInputs.ageFire;
  const ahvUnlockYear = 65 - accInputs.ageFire;

  const decInputs: DecumulationInputs = {
    startingPortfolio: accResult.portfolioAtFire,
    pillarLumpSum: accResult.pillarAtFire,
    pillarUnlockYear,
    ageFire: accInputs.ageFire,
    ahvAnnual,
    ahvUnlockYear: Math.max(1, ahvUnlockYear),
    annualBudget,
    returnRate,
    inflationRate,
    inflationAdjust,
    flatMode,
    maxYears: 60,
  };

  const result = simulateDecumulation(decInputs);

  const longevityLabel =
    result.longevityYears === null
      ? '50+ years (never depleted)'
      : `Year ${result.longevityYears} (age ${accInputs.ageFire + result.longevityYears})`;

  return (
    <div className="flex flex-col gap-6">
      {/* Fed from Phase 1 */}
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
        <div className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">Fed from Phase 1</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
          <Stat label="Starting portfolio" value={fmt(accResult.portfolioAtFire)} />
          <Stat label="2nd pillar lump sum" value={fmt(accResult.pillarAtFire)} />
          <Stat label="2P unlock" value={`Year ${pillarUnlockYear} (age ${accInputs.ageRetirement})`} />
          <Stat label="AHV unlock" value={`Year ${Math.max(1, ahvUnlockYear)} (age 65)`} />
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <InputField label="Annual Budget" value={annualBudget} onChange={setAnnualBudget} prefix="CHF" step={1_000} />
        <InputField label="Portfolio Return" value={returnRate * 100} onChange={v => setReturnRate(v / 100)} suffix="%" step={0.1} />
        <InputField label="Inflation Rate" value={inflationRate * 100} onChange={v => setInflationRate(v / 100)} suffix="%" step={0.1} />
        <InputField label="AHV / AVS Annual" value={ahvAnnual} onChange={setAhvAnnual} prefix="CHF" step={1_000} />
      </div>

      {/* Toggles */}
      <div className="flex gap-6">
        <Toggle label="Inflation-adjust budget" checked={inflationAdjust} onChange={setInflationAdjust} />
        <Toggle label="Flat / no-growth mode (0% return, 0% inflation)" checked={flatMode} onChange={setFlatMode} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label="Initial WR" value={pct(result.initialWithdrawalRate)} color="orange" />
        <Card
          label="WR after 2P unlock"
          value={result.withdrawalRateAfterPillar !== null ? pct(result.withdrawalRateAfterPillar) : '—'}
          sub={`year ${pillarUnlockYear}`}
          color="purple"
        />
        {ahvAnnual > 0 && (
          <Card
            label="WR after AHV"
            value={result.withdrawalRateAfterAhv !== null ? pct(result.withdrawalRateAfterAhv) : '—'}
            sub={`year ${Math.max(1, ahvUnlockYear)}`}
            color="emerald"
          />
        )}
        <Card
          label="Portfolio longevity"
          value={longevityLabel}
          color={result.longevityYears === null ? 'emerald' : 'red'}
        />
      </div>

      {/* Table */}
      {result.rows.length > 0 && (
        <details open>
          <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-800 mb-3">
            Year-by-year table
          </summary>
          <DecumulationTable rows={result.rows} />
        </details>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-amber-600 font-medium">{label}: </span>
      <span className="text-amber-900">{value}</span>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 select-none">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
      </button>
      {label}
    </label>
  );
}

interface CardProps {
  label: string;
  value: string;
  sub?: string;
  color: 'orange' | 'purple' | 'emerald' | 'red';
}

const colors = {
  orange: 'bg-orange-50 border-orange-100',
  purple: 'bg-purple-50 border-purple-100',
  emerald: 'bg-emerald-50 border-emerald-100',
  red: 'bg-red-50 border-red-100',
};

const valueColors = {
  orange: 'text-orange-700',
  purple: 'text-purple-700',
  emerald: 'text-emerald-700',
  red: 'text-red-700',
};

function Card({ label, value, sub, color }: CardProps) {
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-lg font-bold ${valueColors[color]}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}
