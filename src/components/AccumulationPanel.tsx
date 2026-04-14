import type { AccumulationInputs, AccumulationResult } from '../lib/types';
import { InputField } from './InputField';
import { AccumulationTable } from './YearTable';
import { downloadCsv, accumulationCsv } from '../lib/csv-export';
import { computeCoastFire } from '../lib/coast-fire';
import { InfoTooltip } from './InfoTooltip';

const fmt = (n: number) =>
  n.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 });

interface Props {
  inputs: AccumulationInputs;
  onInputsChange: (inputs: AccumulationInputs) => void;
  result: AccumulationResult;
}

export function AccumulationPanel({ inputs, onInputsChange, result }: Props) {
  const set = (key: keyof AccumulationInputs) => (value: number) => {
    onInputsChange({ ...inputs, [key]: value });
  };

  const horizon = inputs.ageFire - inputs.ageNow;
  const coast = computeCoastFire(inputs, result);
  const alreadyCoasting = inputs.initialCapital >= coast.coastNumber;

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
        <StatCard label="Horizon" value={`${horizon} yrs`} sub={`Age ${inputs.ageNow} → ${inputs.ageFire}`} accent="amber" />
        <StatCard label="Portfolio at FIRE" value={fmt(result.portfolioAtFire)} accent="blue" />
        <StatCard label="2nd Pillar at FIRE" value={fmt(result.pillarAtFire)} sub="locked until retirement" accent="violet" />
        <StatCard label="Total Wealth at FIRE" value={fmt(result.totalWealthAtFire)} accent="emerald" bold />
      </div>

      {/* Coast FIRE */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center">
          Coast FIRE
          <InfoTooltip text="The portfolio value you need right now so that, with zero further contributions, compound growth alone carries you to your FIRE target. Once you hit the coast number you can stop saving — time does the rest." />
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Coast Number" value={fmt(coast.coastNumber)} sub="stop contributing, coast to FIRE" accent="blue" />
          <StatCard
            label="Current Portfolio"
            value={fmt(inputs.initialCapital)}
            sub={alreadyCoasting ? 'Already coasting!' : `${fmt(coast.coastNumber - inputs.initialCapital)} to go`}
            accent={alreadyCoasting ? 'emerald' : 'blue'}
          />
          <StatCard
            label="Years to Coast"
            value={coast.yearsToCoast === null ? 'Never' : coast.yearsToCoast === 0 ? 'Now' : `${coast.yearsToCoast} yrs`}
            sub={coast.ageAtCoast !== null && coast.yearsToCoast !== 0 ? `Age ${coast.ageAtCoast}` : undefined}
            accent={coast.yearsToCoast === null ? 'red' : alreadyCoasting ? 'emerald' : 'amber'}
          />
          <StatCard label="FIRE Target" value={fmt(result.portfolioAtFire)} sub={`portfolio at age ${inputs.ageFire}`} accent="emerald" />
        </div>
      </div>

      {/* Table + CSV export */}
      {result.rows.length > 0 && (
        <details open>
          <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-800 mb-3">
            Year-by-year table
          </summary>
          <div className="flex justify-end mb-2">
            <button
              onClick={() => downloadCsv(accumulationCsv(result.rows), 'accumulation.csv')}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 shadow-sm transition-colors"
            >
              Export CSV
            </button>
          </div>
          <AccumulationTable rows={result.rows} />
        </details>
      )}
    </div>
  );
}

// ── Shared card component ─────────────────────────────────────────────────────

type Accent = 'blue' | 'violet' | 'emerald' | 'amber' | 'red' | 'orange';

const accentBorder: Record<Accent, string> = {
  blue:    'border-l-blue-500',
  violet:  'border-l-violet-500',
  emerald: 'border-l-emerald-500',
  amber:   'border-l-amber-500',
  red:     'border-l-red-500',
  orange:  'border-l-orange-500',
};

const accentText: Record<Accent, string> = {
  blue:    'text-blue-700',
  violet:  'text-violet-700',
  emerald: 'text-emerald-700',
  amber:   'text-amber-700',
  red:     'text-red-600',
  orange:  'text-orange-700',
};

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent: Accent;
  bold?: boolean;
  tooltip?: string;
}

export function StatCard({ label, value, sub, accent, bold, tooltip }: StatCardProps) {
  return (
    <div className={`rounded-xl border border-gray-200 border-l-4 ${accentBorder[accent]} bg-white p-4`}>
      <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1.5 flex items-center gap-0.5">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <div className={`${bold ? 'text-2xl' : 'text-xl'} font-bold tabular-nums ${accentText[accent]}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}
