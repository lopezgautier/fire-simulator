import { useState, useEffect } from 'react';
import { simulateAccumulation } from './lib/simulate-accumulation';
import { simulateDecumulation } from './lib/simulate-decumulation';
import type { AccumulationResult, AccumulationInputs, DecConfig, SavedScenario } from './lib/types';
import { DEFAULT_ACC, DEFAULT_DEC, decodeState, encodeState } from './lib/url-state';
import { AccumulationPanel } from './components/AccumulationPanel';
import { DecumulationPanel } from './components/DecumulationPanel';
import { PortfolioChart } from './components/PortfolioChart';
import { ScenarioCompare } from './components/ScenarioCompare';
import type { CurrentSnapshot } from './components/ScenarioCompare';

const SCENARIO_COLORS = ['#f59e0b', '#10b981', '#f43f5e'];

export default function App() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [accInputs, setAccInputs] = useState<AccumulationInputs>(() => decodeState()?.acc ?? DEFAULT_ACC);
  const [decConfig, setDecConfig] = useState<DecConfig>(() => decodeState()?.dec ?? DEFAULT_DEC);
  const [activeTab, setActiveTab] = useState<'acc' | 'dec'>('acc');
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [scenarioCounter, setScenarioCounter] = useState(1);
  const [copied, setCopied] = useState(false);
  const [currentSuccessRate, setCurrentSuccessRate] = useState<number | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  const accResult: AccumulationResult = simulateAccumulation(accInputs);

  const decInputs = {
    startingPortfolio: accResult.portfolioAtFire,
    pillarAtFire: accResult.pillarAtFire,
    pillarRate: accInputs.pillarRate,
    pillarUnlockYear: accInputs.ageRetirement - accInputs.ageFire,
    ageFire: accInputs.ageFire,
    ahvAnnual: decConfig.ahvMonthly * 12,
    ahvUnlockYear: Math.max(1, 65 - accInputs.ageFire),
    annualBudget: decConfig.annualBudget,
    returnRate: decConfig.returnRate,
    inflationRate: decConfig.inflationRate,
    inflationAdjust: decConfig.inflationAdjust,
    flatMode: decConfig.flatMode,
    maxYears: 60,
  };

  const decResult = simulateDecumulation(decInputs);

  // Chart preview dec (same inputs, 80 year horizon)
  const previewDecInputs = { ...decInputs, maxYears: 80 };
  const previewDecResult = simulateDecumulation(previewDecInputs);

  // ── URL: clear params on mount if none present (clean initial state) ──────
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('ic')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleShare = async () => {
    const url = encodeState(accInputs, decConfig);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copy this link:', url);
    }
  };

  const handleSaveScenario = () => {
    if (savedScenarios.length >= 3) return;
    const id = Date.now();
    const colorIdx = savedScenarios.length % SCENARIO_COLORS.length;
    const newScenario: SavedScenario = {
      id,
      label: `Scenario ${scenarioCounter}`,
      color: SCENARIO_COLORS[colorIdx],
      accInputs: { ...accInputs },
      decConfig: { ...decConfig },
      portfolioAtFire: accResult.portfolioAtFire,
      pillarAtFire: accResult.pillarAtFire,
      totalWealthAtFire: accResult.totalWealthAtFire,
      initialWR: decResult.initialWithdrawalRate,
      longevityYears: decResult.longevityYears,
      successRate: currentSuccessRate,
    };
    setSavedScenarios(prev => [...prev, newScenario]);
    setScenarioCounter(n => n + 1);
  };

  const handleLoadScenario = (s: SavedScenario) => {
    setAccInputs(s.accInputs);
    setDecConfig(s.decConfig);
  };

  const handleDeleteScenario = (id: number) => {
    setSavedScenarios(prev => prev.filter(s => s.id !== id));
  };

  // ── Comparison snapshot for current state ─────────────────────────────────
  const currentSnapshot: CurrentSnapshot = {
    accInputs,
    decConfig,
    portfolioAtFire: accResult.portfolioAtFire,
    pillarAtFire: accResult.pillarAtFire,
    totalWealthAtFire: accResult.totalWealthAtFire,
    initialWR: decResult.initialWithdrawalRate,
    longevityYears: decResult.longevityYears,
    successRate: currentSuccessRate,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">FIRE Simulator</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Two-phase portfolio simulation — accumulation → decumulation (CHF / Swiss 2nd pillar)
            </p>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 shadow-sm transition-colors"
          >
            {copied ? '✓ Copied' : '🔗 Share'}
          </button>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Portfolio Overview</h2>
          <PortfolioChart
            accRows={accResult.rows}
            decRows={previewDecResult.rows}
            fireAge={accInputs.ageFire}
            pillarUnlockAge={accInputs.ageRetirement}
            ahvUnlockAge={65}
          />
          <p className="text-xs text-gray-400 mt-2">
            Decumulation uses Phase 2 settings. Configure below.
          </p>
        </div>

        {/* Tabs + actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <TabButton active={activeTab === 'acc'} onClick={() => setActiveTab('acc')}>
              Phase 1 — Accumulation
            </TabButton>
            <TabButton active={activeTab === 'dec'} onClick={() => setActiveTab('dec')}>
              Phase 2 — Decumulation
            </TabButton>
          </div>
          <button
            onClick={handleSaveScenario}
            disabled={savedScenarios.length >= 3}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            + Save Scenario {savedScenarios.length > 0 && `(${savedScenarios.length}/3)`}
          </button>
        </div>

        {/* Active panel */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {activeTab === 'acc' ? (
            <AccumulationPanel
              inputs={accInputs}
              onInputsChange={setAccInputs}
              result={accResult}
            />
          ) : (
            <DecumulationPanel
              accResult={accResult}
              accInputs={accInputs}
              config={decConfig}
              onConfigChange={setDecConfig}
              decResult={decResult}
              decInputs={decInputs}
              onSuccessRateChange={setCurrentSuccessRate}
            />
          )}
        </div>

        {/* Scenario comparison */}
        <ScenarioCompare
          current={currentSnapshot}
          saved={savedScenarios}
          onLoad={handleLoadScenario}
          onDelete={handleDeleteScenario}
        />

      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
    >
      {children}
    </button>
  );
}
