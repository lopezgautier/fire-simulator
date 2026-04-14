import type { DecumulationInputs, SWRResult } from './types';
import { runMonteCarlo } from './monte-carlo';

/**
 * Binary search over annualBudget to find the maximum budget that achieves
 * at least `targetSuccessRate` (converges when range < CHF 100, max 20 iterations).
 *
 * Uses 300 sims per iteration (vs 500 for the main stress test) — precision is
 * sufficient since we converge on the budget, not on the exact rate.
 */
export function findSafeBudget(
  inputs: DecumulationInputs,
  targetSuccessRate: number,
  volatility: number,
  targetYears: number,
): SWRResult {
  let lo = 0;
  let hi = inputs.startingPortfolio; // 100% WR always fails — safe upper bound
  let bestBudget = 0;
  let bestRate = 0;

  const TOLERANCE = 0.005;
  const MAX_ITER = 20;
  const NUM_SIMS = 300;

  for (let i = 0; i < MAX_ITER; i++) {
    const mid = (lo + hi) / 2;
    const testInputs: DecumulationInputs = { ...inputs, annualBudget: mid };
    const { successRate } = runMonteCarlo(testInputs, volatility, targetYears, NUM_SIMS);

    if (successRate >= targetSuccessRate - TOLERANCE) {
      bestBudget = mid;
      bestRate = successRate;
      lo = mid;
    } else {
      hi = mid;
    }

    if (hi - lo < 100) break;
  }

  return {
    safeBudget: Math.round(bestBudget / 100) * 100,
    safeWR: inputs.startingPortfolio > 0 ? bestBudget / inputs.startingPortfolio : 0,
    achievedSuccessRate: bestRate,
  };
}
