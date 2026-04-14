import { useState } from 'react';
import type { AccumulationInputs, AccumulationResult } from '../lib/types';
import { simulateAccumulation } from '../lib/simulate-accumulation';
import { InputField } from './InputField';
import { AccumulationTable } from './YearTable';

const DEFAULTS: AccumulationInputs = {
  initialCapital: 350_000,
  yearlySavings: 66_000,
  returnRate: 0.06,
  ageNow: 32,
  ageFire: 49,
  pillarContribution: 10_200,
  pillarRate: 0.015,
  ageRetirement: 65,
  initialPillar: 0,
};

const fmt = (n: number) =>
  n.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 });

interface Props {
  onResult: (result: AccumulationResult, inputs: AccumulationInputs) => void;
}

export function AccumulationPanel({ onResult }: Props) {
  const [inputs, setInputs] = useState<AccumulationInputs>(DEFAULTS);

  const set = (key: keyof AccumulationInputs) => (value: number) => {
    const updated = { ...inputs, [key]: value };
    setInputs(updated);
    const result = simulateAccumulation(updated);
    onResult(result, updated);
  };

  const result = simulateAccumulation(inputs);
  const horizon = inputs.ageFire - inputs.ageNow;

  return (
    <div className="flex flex-col gap-6">
      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <InputField label="Current Age" value={inputs.ageNow} onChange={set('ageNow')} suffix="yrs" decimals={0} />
        <InputField label="FIRE Age" value={inputs.ageFire} onChange={set('ageFire')} suffix="yrs" decimals={0} />
        <InputField label="2nd Pillar Unlock Age" value={inputs.ageRetirement} onChange={set('ageRetirement')} suffix="yrs" decimals={0} />
        <InputField label="Initial Capital" value={inputs.initialCapital} onChange={set('initialCapital')} prefix="CHF" step={10_000} decimals={0} />
        <InputField label="Yearly Savings" value={inputs.yearlySavings} onChange={set('yearlySavings')} prefix="CHF" step={1_000} decimals={0} />
        <InputField label="Portfolio Return (nominal)" value={inputs.returnRate * 100} onChange={v => set('returnRate')(v / 100)} suffix="%" step={0.1} decimals={1} />
        <InputField label="Initial 2nd Pillar" value={inputs.initialPillar} onChange={set('initialPillar')} prefix="CHF" step={1_000} decimals={0} />
        <InputField label="Yearly 2nd Pillar Contrib." value={inputs.pillarContribution} onChange={set('pillarContribution')} prefix="CHF" step={100} decimals={0} />
        <InputField label="2nd Pillar Return" value={inputs.pillarRate * 100} onChange={v => set('pillarRate')(v / 100)} suffix="%" step={0.1} decimals={1} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label="Horizon" value={`${horizon} years`} sub={`Age ${inputs.ageNow} → ${inputs.ageFire}`} color="blue" />
        <Card label="Portfolio at FIRE" value={fmt(result.portfolioAtFire)} color="blue" />
        <Card label="2nd Pillar at FIRE" value={fmt(result.pillarAtFire)} sub="locked until retirement" color="purple" />
        <Card label="Total Wealth at FIRE" value={fmt(result.totalWealthAtFire)} color="emerald" />
      </div>

      {/* Table */}
      {result.rows.length > 0 && (
        <details open>
          <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-800 mb-3">
            Year-by-year table
          </summary>
          <AccumulationTable rows={result.rows} />
        </details>
      )}
    </div>
  );
}

interface CardProps {
  label: string;
  value: string;
  sub?: string;
  color: 'blue' | 'purple' | 'emerald';
}

const colors = {
  blue: 'bg-blue-50 border-blue-100',
  purple: 'bg-purple-50 border-purple-100',
  emerald: 'bg-emerald-50 border-emerald-100',
};

const valueColors = {
  blue: 'text-blue-700',
  purple: 'text-purple-700',
  emerald: 'text-emerald-700',
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
