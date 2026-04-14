import { useState, useEffect } from 'react';
import type { AccumulationResult, AccumulationInputs, DecumulationInputs, DecConfig, MCResult, SWRResult } from '../lib/types';
import { InputField } from './InputField';
import { DecumulationTable } from './YearTable';
import { MonteCarloSection } from './MonteCarloSection';
import { runMonteCarlo } from '../lib/monte-carlo';
import { HISTORICAL_SEQUENCES, runHistoricalSim } from '../lib/historical-sequences';
import { findSafeBudget } from '../lib/swr-backsolver';
import type { HistoricalSimLine } from '../lib/types';
import { downloadCsv, decumulationCsv } from '../lib/csv-export';
import { InfoTooltip } from './InfoTooltip';
import { StatCard } from './AccumulationPanel';

const fmt = (n: number) =>
  n.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 });
const pct = (n: number) => (n * 100).toFixed(2) + '%';

interface Props {
  accResult: AccumulationResult;
  accInputs: AccumulationInputs;
  config: DecConfig;
  onConfigChange: (config: DecConfig) => void;
  decResult: import('../lib/types').DecumulationResult;
  decInputs: DecumulationInputs;
  onSuccessRateChange: (rate: number | null) => void;
}

export function DecumulationPanel({
  accResult, accInputs, config, onConfigChange, decResult, decInputs, onSuccessRateChange,
}: Props) {
  const [volatility, setVolatility] = useState(0.12);
  const [targetAge, setTargetAge] = useState(95);
  const [mcResult, setMcResult] = useState<MCResult | null>(null);
  const [mcRunning, setMcRunning] = useState(false);
  const [historicalLines, setHistoricalLines] = useState<HistoricalSimLine[]>([]);
  const [targetSuccessRate, setTargetSuccessRate] = useState(0.90);
  const [swrResult, setSwrResult] = useState<SWRResult | null>(null);
  const [swrRunning, setSwrRunning] = useState(false);

  const set = <K extends keyof DecConfig>(key: K) => (value: DecConfig[K]) => {
    onConfigChange({ ...config, [key]: value });
  };

  const pillarUnlockYear = accInputs.ageRetirement - accInputs.ageFire;
  const ahvUnlockYear = 65 - accInputs.ageFire;

  const longevityLabel =
    decResult.longevityYears === null
      ? '50+ yrs (never depleted)'
      : `Year ${decResult.longevityYears} (age ${accInputs.ageFire + decResult.longevityYears})`;

  const handleFindSafeBudget = () => {
    setSwrRunning(true);
    setTimeout(() => {
      const targetYears = targetAge - accInputs.ageFire;
      const result = findSafeBudget(decInputs, targetSuccessRate, volatility, targetYears);
      setSwrResult(result);
      setSwrRunning(false);
    }, 0);
  };

  const handleRunMC = () => {
    setMcRunning(true);
    setTimeout(() => {
      const targetYears = targetAge - accInputs.ageFire;
      const result = runMonteCarlo(decInputs, volatility, targetYears, 500);
      const histLines = HISTORICAL_SEQUENCES.map(seq => runHistoricalSim(decInputs, seq, targetYears));
      setMcResult(result);
      setHistoricalLines(histLines);
      onSuccessRateChange(result.successRate);
      setMcRunning(false);
    }, 0);
  };

  useEffect(() => {
    setMcResult(null);
    setHistoricalLines([]);
    setSwrResult(null);
    onSuccessRateChange(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.annualBudget, config.returnRate, config.inflationRate,
    config.inflationAdjust, config.flatMode, config.ahvMonthly,
    accResult.portfolioAtFire, accResult.pillarAtFire,
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Fed from Phase 1 */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Fed from Phase 1</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
          <Stat label="Starting portfolio" value={fmt(accResult.portfolioAtFire)} />
          <Stat label="2nd pillar lump sum" value={fmt(accResult.pillarAtFire)} />
          <Stat label="2P unlock" value={`Year ${pillarUnlockYear} (age ${accInputs.ageRetirement})`} />
          <Stat label="AHV unlock" value={`Year ${Math.max(1, ahvUnlockYear)} (age 65)`} />
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <InputField label="Annual Budget" value={config.annualBudget} onChange={v => set('annualBudget')(v)} prefix="CHF" step={1_000} decimals={0} />
        <InputField label="Portfolio Return (nominal)" value={config.returnRate * 100} onChange={v => set('returnRate')(v / 100)} suffix="%" step={0.1} decimals={1} />
        <InputField label="Inflation Rate" value={config.inflationRate * 100} onChange={v => set('inflationRate')(v / 100)} suffix="%" step={0.1} decimals={1} />
        <InputField label="AHV / AVS Monthly" value={config.ahvMonthly} onChange={v => set('ahvMonthly')(v)} prefix="CHF" step={100} decimals={0} />
        <InputField label="Retirement Duration" value={config.retirementDuration} onChange={v => set('retirementDuration')(v)} suffix="yrs" step={5} decimals={0} />
      </div>

      {/* Toggles */}
      <div className="flex gap-6 flex-wrap">
        <Toggle label="Inflation-adjust budget" checked={config.inflationAdjust} onChange={v => set('inflationAdjust')(v)} />
        <Toggle label="Flat / no-growth mode" checked={config.flatMode} onChange={v => set('flatMode')(v)} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Initial WR"
          value={pct(decResult.initialWithdrawalRate)}
          accent="orange"
          tooltip="Withdrawal Rate: the share of your portfolio drawn in year 1. Calculated as portfolio draw ÷ start-of-year portfolio value. A common FIRE target is ≤ 4%."
        />
        <StatCard
          label="WR after 2P unlock"
          value={decResult.withdrawalRateAfterPillar !== null ? pct(decResult.withdrawalRateAfterPillar) : '—'}
          sub={`year ${pillarUnlockYear}`}
          accent="violet"
        />
        {config.ahvMonthly > 0 && (
          <StatCard
            label="WR after AHV"
            value={decResult.withdrawalRateAfterAhv !== null ? pct(decResult.withdrawalRateAfterAhv) : '—'}
            sub={`year ${Math.max(1, ahvUnlockYear)}`}
            accent="emerald"
          />
        )}
        <StatCard
          label="Portfolio longevity"
          value={longevityLabel}
          accent={decResult.longevityYears === null ? 'emerald' : 'red'}
        />
      </div>

      {/* Monte Carlo stress test */}
      <div className="border border-gray-200 rounded-xl p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center">
            Monte Carlo Stress Test
            <InfoTooltip text="Runs 500 simulations where each year's portfolio return is drawn randomly from a normal distribution centred on your expected return with the volatility (σ) you set. Shows how sequence-of-returns risk affects your plan." />
          </h3>
          <button
            onClick={handleRunMC}
            disabled={mcRunning}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mcRunning ? 'Running…' : 'Run Stress Test'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <InputField label="Return Volatility (σ)" value={volatility * 100} onChange={v => setVolatility(v / 100)} suffix="%" step={0.5} decimals={1} />
          <InputField label="Target Age" value={targetAge} onChange={setTargetAge} suffix="yrs" decimals={0} />
        </div>

        {mcResult && (
          <MonteCarloSection
            result={mcResult}
            targetAge={targetAge}
            ageFire={accInputs.ageFire}
            pillarUnlockAge={accInputs.ageRetirement}
            ahvUnlockAge={65}
            historicalLines={historicalLines}
          />
        )}
        {!mcResult && (
          <p className="text-xs text-gray-400">
            Set volatility (e.g. 12% for a global equity fund) and target age, then run 500 simulations.
          </p>
        )}

        {/* SWR Back-solver */}
        <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center">
            Safe Withdrawal Rate Solver
            <InfoTooltip text="Binary-searches the highest annual budget that still achieves your target success rate, using the same volatility and horizon as the stress test above. Read-only — does not change your budget input." />
          </p>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="w-44">
              <InputField
                label="Target Success Rate"
                value={targetSuccessRate * 100}
                onChange={v => { setTargetSuccessRate(v / 100); setSwrResult(null); }}
                suffix="%"
                step={5}
                decimals={0}
              />
            </div>
            <button
              onClick={handleFindSafeBudget}
              disabled={swrRunning}
              className="mb-0.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {swrRunning ? 'Solving…' : 'Find Safe Budget'}
            </button>
          </div>
          {swrResult && (() => {
            const diff = swrResult.safeBudget - config.annualBudget;
            const noSolution = swrResult.safeBudget === 0;
            return noSolution ? (
              <p className="text-xs text-red-500">
                No budget achieves {(targetSuccessRate * 100).toFixed(0)}% success with these assumptions.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  label={`Safe Budget (${(targetSuccessRate * 100).toFixed(0)}% success)`}
                  value={fmt(swrResult.safeBudget)}
                  sub={`${(swrResult.safeWR * 100).toFixed(2)}% WR`}
                  accent="emerald"
                />
                <StatCard
                  label="vs. Current Budget"
                  value={(diff >= 0 ? '+' : '') + fmt(diff)}
                  sub={diff >= 0 ? 'headroom' : 'overspending'}
                  accent={diff >= 0 ? 'emerald' : 'red'}
                />
                <StatCard
                  label="Achieved Rate"
                  value={`${(swrResult.achievedSuccessRate * 100).toFixed(0)}%`}
                  sub={`target: ${(targetSuccessRate * 100).toFixed(0)}%`}
                  accent="violet"
                />
              </div>
            );
          })()}
          {!swrResult && (
            <p className="text-xs text-gray-400">
              Back-solves the max annual budget that hits your target success rate.
            </p>
          )}
        </div>
      </div>

      {/* Table + CSV export */}
      {decResult.rows.length > 0 && (
        <details open>
          <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-800 mb-3">
            Year-by-year table
          </summary>
          <div className="flex justify-end mb-2">
            <button
              onClick={() => downloadCsv(decumulationCsv(decResult.rows), 'decumulation.csv')}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 shadow-sm transition-colors"
            >
              Export CSV
            </button>
          </div>
          <DecumulationTable rows={decResult.rows} />
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
