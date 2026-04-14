import { useState } from 'react';
import { simulateAccumulation } from './lib/simulate-accumulation';
import { simulateDecumulation } from './lib/simulate-decumulation';
import type { AccumulationResult, AccumulationInputs } from './lib/types';
import { AccumulationPanel } from './components/AccumulationPanel';
import { DecumulationPanel } from './components/DecumulationPanel';
import { PortfolioChart } from './components/PortfolioChart';

const DEFAULT_INPUTS: AccumulationInputs = {
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

const DEFAULT_RESULT = simulateAccumulation(DEFAULT_INPUTS);

export default function App() {
  const [accResult, setAccResult] = useState<AccumulationResult>(DEFAULT_RESULT);
  const [accInputs, setAccInputs] = useState<AccumulationInputs>(DEFAULT_INPUTS);
  const [activeTab, setActiveTab] = useState<'acc' | 'dec'>('acc');
  const [decBudget] = useState(80_000);

  const handleAccResult = (result: AccumulationResult, inputs: AccumulationInputs) => {
    setAccResult(result);
    setAccInputs(inputs);
  };

  // Chart preview uses a fixed decumulation baseline so the chart always renders
  const previewDecResult = simulateDecumulation({
    startingPortfolio: accResult.portfolioAtFire,
    pillarLumpSum: accResult.pillarAtFire,
    pillarUnlockYear: accInputs.ageRetirement - accInputs.ageFire,
    ageFire: accInputs.ageFire,
    ahvAnnual: 0,
    ahvUnlockYear: Math.max(1, 65 - accInputs.ageFire),
    annualBudget: decBudget,
    returnRate: 0.04,
    inflationRate: 0.02,
    inflationAdjust: false,
    flatMode: false,
    maxYears: 60,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">FIRE Simulator</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Two-phase portfolio simulation — accumulation → decumulation (CHF / Swiss 2nd pillar)
          </p>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Portfolio Overview</h2>
          <PortfolioChart
            accRows={accResult.rows}
            decRows={previewDecResult.rows}
            fireAge={accInputs.ageFire}
            pillarUnlockAge={accInputs.ageRetirement}
            ahvUnlockAge={65}
          />
          <p className="text-xs text-gray-400 mt-2">
            Decumulation preview uses CHF 80k budget / 4% return. Configure details in Phase 2.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          <TabButton active={activeTab === 'acc'} onClick={() => setActiveTab('acc')}>
            Phase 1 — Accumulation
          </TabButton>
          <TabButton active={activeTab === 'dec'} onClick={() => setActiveTab('dec')}>
            Phase 2 — Decumulation
          </TabButton>
        </div>

        {/* Panel */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {activeTab === 'acc' ? (
            <AccumulationPanel onResult={handleAccResult} />
          ) : (
            <DecumulationPanel accResult={accResult} accInputs={accInputs} />
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}
