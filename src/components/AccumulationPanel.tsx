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
        <Card label="Horizon" value={`${horizon} years`} sub={`Age ${inputs.ageNow} → ${inputs.ageFire}`} color="blue" />
        <Card label="Portfolio at FIRE" value={fmt(result.portfolioAtFire)} color="blue" />
        <Card label="2nd Pillar at FIRE" value={fmt(result.pillarAtFire)} sub="locked until retirement" color="purple" />
        <Card label="Total Wealth at FIRE" value={fmt(result.totalWealthAtFire)} color="emerald" />
      </div>

      {/* Coast FIRE */}
      <div className="border border-sky-100 rounded-xl p-4 bg-sky-50 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide flex items-center">
          Coast FIRE
          <InfoTooltip text="The portfolio value you need right now so that, with zero further contributions, compound growth alone carries you to your FIRE target. Once you hit the coast number you can stop saving — time does the rest." />
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card
            label="Coast Number"
            value={fmt(coast.coastNumber)}
            sub="stop contributions, coast to FIRE"
            color="blue"
          />
          <Card
            label="Current Portfolio"
            value={fmt(inputs.initialCapital)}
            sub={alreadyCoasting ? 'already coasting!' : `${fmt(coast.coastNumber - inputs.initialCapital)} to go`}
            color={alreadyCoasting ? 'emerald' : 'blue'}
          />
          <Card
            label="Years to Coast"
            value={
              coast.yearsToCoast === null
                ? 'Never'
                : coast.yearsToCoast === 0
                  ? 'Now'
                  : `${coast.yearsToCoast} yrs`
            }
            sub={coast.ageAtCoast !== null && coast.yearsToCoast !== 0 ? `Age ${coast.ageAtCoast}` : undefined}
            color={coast.yearsToCoast === null ? 'red' : alreadyCoasting ? 'emerald' : 'blue'}
          />
          <Card
            label="Target at FIRE"
            value={fmt(result.portfolioAtFire)}
            sub={`age ${inputs.ageFire} (portfolio only)`}
            color="emerald"
          />
        </div>
      </div>

      {/* Table + CSV export */}
      {result.rows.length > 0 && (
        <details open>
          <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-800 mb-3 flex items-center justify-between">
            <span>Year-by-year table</span>
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

interface CardProps {
  label: string;
  value: string;
  sub?: string;
  color: 'blue' | 'purple' | 'emerald' | 'red';
}

const colors = {
  blue: 'bg-blue-50 border-blue-100',
  purple: 'bg-purple-50 border-purple-100',
  emerald: 'bg-emerald-50 border-emerald-100',
  red: 'bg-red-50 border-red-100',
};

const valueColors = {
  blue: 'text-blue-700',
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
