import type { DecumulationInputs, DecumulationResult, DecumulationRow } from './types';

export function simulateDecumulation(inputs: DecumulationInputs): DecumulationResult {
  const {
    startingPortfolio,
    pillarAtFire,
    pillarRate,
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

  // Locked pillar keeps earning BVG interest after FIRE (no more contributions)
  let lockedPillar = pillarAtFire;

  let longevityYears: number | null = null;
  let initialWithdrawalRate: number | null = null;
  let withdrawalRateAfterPillar: number | null = null;
  let withdrawalRateAfterAhv: number | null = null;

  for (let y = 1; y <= maxYears; y++) {
    if (portfolio <= 0) break;

    const age = ageFire + y;
    const notes: string[] = [];

    // Pillar grows at BVG rate while locked, then merges into portfolio at unlock
    if (y < pillarUnlockYear) {
      lockedPillar = lockedPillar * (1 + pillarRate);
    } else if (y === pillarUnlockYear) {
      lockedPillar = lockedPillar * (1 + pillarRate); // final year of growth
      portfolio += lockedPillar;
      lockedPillar = 0;
      notes.push('2P unlocked');
    }
    // after unlock: lockedPillar stays 0

    if (ahvAnnual > 0 && y === ahvUnlockYear) {
      notes.push('AHV starts');
    }

    // portfolioStart after lump sum added, before growth/withdrawal — denominator for WR
    const portfolioStart = portfolio;

    const ahvOffset = ahvAnnual > 0 && y >= ahvUnlockYear ? ahvAnnual : 0;
    const portfolioDraw = Math.max(0, budget - ahvOffset);

    portfolio = portfolio * (1 + effectiveReturn) - portfolioDraw;

    const wr = portfolioStart > 0 ? portfolioDraw / portfolioStart : 0;

    if (y === 1) initialWithdrawalRate = wr;
    if (y === pillarUnlockYear) withdrawalRateAfterPillar = wr;
    if (ahvAnnual > 0 && y === ahvUnlockYear) withdrawalRateAfterAhv = wr;

    let note = notes.length > 0 ? notes.join(' + ') : 'drawing';
    const portfolioEnd = Math.max(0, portfolio);
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
      portfolioEnd,
      lockedPillar,
      totalWealth: portfolioEnd + lockedPillar,
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
