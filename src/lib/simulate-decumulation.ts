import type { DecumulationInputs, DecumulationResult, DecumulationRow } from './types';

export function simulateDecumulation(inputs: DecumulationInputs): DecumulationResult {
  const {
    startingPortfolio,
    pillarLumpSum,
    pillarUnlockYear,
    ageFire,
    ahvAnnual,
    ahvUnlockYear,
    annualBudget,
    returnRate,
    inflationRate,
    inflationAdjust,
    flatMode,
    maxYears,
  } = inputs;

  const effectiveReturn = flatMode ? 0 : returnRate;
  const effectiveInflation = flatMode ? 0 : inflationRate;

  const rows: DecumulationRow[] = [];
  let portfolio = startingPortfolio;
  let budget = annualBudget;
  let longevityYears: number | null = null;

  let initialWithdrawalRate: number | null = null;
  let withdrawalRateAfterPillar: number | null = null;
  let withdrawalRateAfterAhv: number | null = null;

  for (let y = 1; y <= maxYears; y++) {
    if (portfolio <= 0) break;

    // End-of-year age: FIRE at 49, year 1 ends at age 50, year 16 ends at age 65
    const age = ageFire + y;
    const notes: string[] = [];

    // Add lump sums before computing portfolioStart so WR reflects true balance
    if (y === pillarUnlockYear && pillarLumpSum > 0) {
      portfolio += pillarLumpSum;
      notes.push('2P unlocked');
    }
    if (ahvAnnual > 0 && y === ahvUnlockYear) {
      notes.push('AHV starts');
    }

    // portfolioStart captured AFTER lump sums, BEFORE growth/withdrawal
    const portfolioStart = portfolio;

    // AHV offsets the portfolio draw; total lifestyle spend stays at `budget`
    const ahvOffset = ahvAnnual > 0 && y >= ahvUnlockYear ? ahvAnnual : 0;
    const portfolioDraw = Math.max(0, budget - ahvOffset);

    // Grow portfolio then subtract draw (end-of-year withdrawal)
    portfolio = portfolio * (1 + effectiveReturn) - portfolioDraw;

    const wr = portfolioStart > 0 ? portfolioDraw / portfolioStart : 0;

    if (y === 1) initialWithdrawalRate = wr;
    if (y === pillarUnlockYear) withdrawalRateAfterPillar = wr;
    if (ahvAnnual > 0 && y === ahvUnlockYear) withdrawalRateAfterAhv = wr;

    let note = notes.length > 0 ? notes.join(' + ') : 'drawing';
    if (portfolio <= 0) {
      note = 'depleted';
      longevityYears = y;
    }

    rows.push({
      year: y,
      age,
      totalBudget: budget,
      portfolioDraw,
      portfolioStart,
      portfolioEnd: Math.max(0, portfolio),
      withdrawalRate: wr,
      note,
    });

    if (portfolio <= 0) break;

    if (inflationAdjust) {
      budget = budget * (1 + effectiveInflation);
    }
  }

  return {
    rows,
    initialWithdrawalRate: initialWithdrawalRate ?? 0,
    withdrawalRateAfterPillar,
    withdrawalRateAfterAhv,
    longevityYears,
  };
}
