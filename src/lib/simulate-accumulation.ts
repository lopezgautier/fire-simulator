import type { AccumulationInputs, AccumulationResult, AccumulationRow } from './types';

export function simulateAccumulation(inputs: AccumulationInputs): AccumulationResult {
  const {
    initialCapital,
    yearlySavings,
    returnRate,
    ageNow,
    ageFire,
    pillarContribution,
    pillarRate,
    initialPillar,
  } = inputs;

  const horizon = ageFire - ageNow;
  if (horizon <= 0) {
    return {
      rows: [],
      portfolioAtFire: initialCapital,
      pillarAtFire: initialPillar,
      totalWealthAtFire: initialCapital + initialPillar,
    };
  }

  const rows: AccumulationRow[] = [];
  let portfolio = initialCapital;
  let pillar = initialPillar;

  for (let y = 1; y <= horizon; y++) {
    // End-of-year convention: portfolio grows first, then contribution arrives.
    // Matches the decumulation convention (grow then transact).
    portfolio = portfolio * (1 + returnRate) + yearlySavings;
    pillar = pillar * (1 + pillarRate) + pillarContribution;

    // Total cash contributed — straight sum, no compounding
    const totalInvested = initialCapital + yearlySavings * y + pillarContribution * y;
    const totalWealth = portfolio + pillar;
    const totalGain = totalWealth - totalInvested;

    rows.push({
      year: y,
      age: ageNow + y,
      portfolio,
      pillar,
      totalWealth,
      totalInvested,
      totalGain,
    });
  }

  const last = rows[rows.length - 1];

  return {
    rows,
    portfolioAtFire: last.portfolio,
    pillarAtFire: last.pillar,
    totalWealthAtFire: last.totalWealth,
  };
}
