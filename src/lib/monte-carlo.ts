import type { DecumulationInputs, MCBand, MCResult } from './types';

// Box-Muller transform — standard normal random variable
function randn(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function percentileOf(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[Math.max(0, Math.min(i, sorted.length - 1))];
}

/**
 * Run Monte Carlo simulations over the decumulation phase.
 *
 * Each simulation draws a random annual return from N(returnRate, volatility²).
 * All other logic mirrors simulate-decumulation exactly (pillar growth, AHV offset,
 * inflation-adjust), so the only variable is the sequence of returns.
 *
 * Success = portfolio > 0 at year `targetYears`.
 */
export function runMonteCarlo(
  inputs: DecumulationInputs,
  volatility: number,   // annual return std dev, e.g. 0.12
  targetYears: number,  // years to simulate, e.g. 95 - 49 = 46
  numSims = 500,
): MCResult {
  const {
    startingPortfolio, pillarAtFire, pillarRate, pillarUnlockYear,
    ageFire, ahvAnnual, ahvUnlockYear, annualBudget,
    returnRate, inflationAdjust, inflationRate, flatMode,
  } = inputs;

  const baseReturn = flatMode ? 0 : returnRate;
  const effectiveInflation = flatMode ? 0 : inflationRate;
  const simYears = Math.max(1, Math.min(targetYears, 80));

  // yearlyPortfolios[y-1] = array of portfolio values at end of year y across all sims
  const yearlyPortfolios: number[][] = Array.from({ length: simYears }, () => []);
  let successCount = 0;

  for (let s = 0; s < numSims; s++) {
    let portfolio = startingPortfolio;
    let lockedPillar = pillarAtFire;
    let budget = annualBudget;
    let depleted = false;

    for (let y = 1; y <= simYears; y++) {
      if (depleted) {
        yearlyPortfolios[y - 1].push(0);
        continue;
      }

      // Pillar grows at BVG rate and merges at unlock year
      if (y < pillarUnlockYear) {
        lockedPillar *= (1 + pillarRate);
      } else if (y === pillarUnlockYear) {
        lockedPillar *= (1 + pillarRate);
        portfolio += lockedPillar;
        lockedPillar = 0;
      }

      const ahvOffset = ahvAnnual > 0 && y >= ahvUnlockYear ? ahvAnnual : 0;
      const draw = Math.max(0, budget - ahvOffset);

      // Random return: N(baseReturn, volatility²)
      const r = flatMode ? 0 : baseReturn + randn() * volatility;
      portfolio = portfolio * (1 + r) - draw;

      if (portfolio <= 0) {
        depleted = true;
        yearlyPortfolios[y - 1].push(0);
      } else {
        yearlyPortfolios[y - 1].push(portfolio);
      }

      if (inflationAdjust) {
        budget *= (1 + effectiveInflation);
      }
    }

    if (!depleted) successCount++;
  }

  const bands: MCBand[] = yearlyPortfolios.map((vals, idx) => {
    const sorted = [...vals].sort((a, b) => a - b);
    return {
      age: ageFire + idx + 1,
      p10: percentileOf(sorted, 10),
      p25: percentileOf(sorted, 25),
      p50: percentileOf(sorted, 50),
      p75: percentileOf(sorted, 75),
      p90: percentileOf(sorted, 90),
    };
  });

  return { successRate: successCount / numSims, bands, numSims };
}
