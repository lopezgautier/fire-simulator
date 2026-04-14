import type { DecumulationInputs, HistoricalSequence, HistoricalSimLine } from './types';

/**
 * Annual nominal total-return sequences (global equity, USD proxy).
 * Years beyond the sequence length use the sequence mean as fill.
 */
export const HISTORICAL_SEQUENCES: HistoricalSequence[] = [
  {
    id: 'dotcom',
    label: '2000–09 Dot-com',
    color: '#f97316', // orange-500
    // S&P 500 TR: 2000–2009
    returns: [-0.091, -0.118, -0.221, 0.287, 0.108, 0.049, 0.158, 0.055, -0.370, 0.265],
  },
  {
    id: 'stagflation',
    label: '1966–75 Stagflation',
    color: '#dc2626', // red-600
    // S&P 500 TR: 1966–1975
    returns: [-0.100, 0.239, 0.110, -0.086, 0.040, 0.143, 0.189, -0.146, -0.263, 0.372],
  },
  {
    id: 'gfc',
    label: '2007–15 GFC',
    color: '#7c3aed', // violet-700
    // S&P 500 TR: 2007–2015
    returns: [0.055, -0.370, 0.265, 0.151, 0.021, 0.160, 0.322, 0.136, 0.014],
  },
];

/**
 * Run a single deterministic decumulation simulation using a fixed return sequence.
 * For years beyond sequence.returns.length, the sequence mean is used as fill.
 */
export function runHistoricalSim(
  inputs: DecumulationInputs,
  sequence: HistoricalSequence,
  simYears: number,
): HistoricalSimLine {
  const {
    startingPortfolio, pillarAtFire, pillarRate, pillarUnlockYear,
    ageFire, ahvAnnual, ahvUnlockYear, annualBudget,
    inflationAdjust, inflationRate, flatMode,
  } = inputs;

  const meanReturn =
    sequence.returns.reduce((a, b) => a + b, 0) / sequence.returns.length;

  let portfolio = startingPortfolio;
  let lockedPillar = pillarAtFire;
  let budget = annualBudget;
  const portfolioByAge: { age: number; value: number }[] = [];

  for (let y = 1; y <= simYears; y++) {
    if (portfolio <= 0) {
      portfolioByAge.push({ age: ageFire + y, value: 0 });
      continue;
    }

    if (y < pillarUnlockYear) {
      lockedPillar *= (1 + pillarRate);
    } else if (y === pillarUnlockYear) {
      lockedPillar *= (1 + pillarRate);
      portfolio += lockedPillar;
      lockedPillar = 0;
    }

    const ahvOffset = ahvAnnual > 0 && y >= ahvUnlockYear ? ahvAnnual : 0;
    const draw = Math.max(0, budget - ahvOffset);

    const r = flatMode ? 0 : (sequence.returns[y - 1] ?? meanReturn);
    portfolio = portfolio * (1 + r) - draw;
    portfolioByAge.push({ age: ageFire + y, value: Math.max(0, portfolio) });

    if (inflationAdjust) {
      budget *= (1 + (flatMode ? 0 : inflationRate));
    }
  }

  return {
    id: sequence.id,
    label: sequence.label,
    color: sequence.color,
    portfolioByAge,
  };
}
