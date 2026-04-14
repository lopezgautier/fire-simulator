import type { AccumulationInputs, AccumulationResult, CoastFireResult } from './types';

/**
 * Compute the Coast FIRE number: the portfolio value needed today such that,
 * with no further contributions, it grows to portfolioAtFire by ageFire.
 *
 * Formula: coastNumber = portfolioAtFire / (1 + returnRate)^(ageFire - ageNow)
 *
 * yearsToCoast = first year in accResult.rows where portfolio >= coastNumber
 * (the point at which you could stop contributing and still hit the target).
 */
export function computeCoastFire(
  inputs: AccumulationInputs,
  accResult: AccumulationResult,
): CoastFireResult {
  const target = accResult.portfolioAtFire;
  const yearsRemaining = inputs.ageFire - inputs.ageNow;

  if (yearsRemaining <= 0) {
    return { coastNumber: target, yearsToCoast: 0, ageAtCoast: inputs.ageNow };
  }

  const coastNumber = target / Math.pow(1 + inputs.returnRate, yearsRemaining);

  if (inputs.initialCapital >= coastNumber) {
    return { coastNumber, yearsToCoast: 0, ageAtCoast: inputs.ageNow };
  }

  for (const row of accResult.rows) {
    if (row.portfolio >= coastNumber) {
      return { coastNumber, yearsToCoast: row.year, ageAtCoast: row.age };
    }
  }

  // Portfolio never reaches coast number within the horizon
  return { coastNumber, yearsToCoast: null, ageAtCoast: null };
}
