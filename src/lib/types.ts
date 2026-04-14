export interface AccumulationInputs {
  initialCapital: number;       // CHF
  yearlySavings: number;        // CHF/year
  returnRate: number;           // e.g. 0.06
  ageNow: number;
  ageFire: number;              // determines horizon = ageFire - ageNow
  pillarContribution: number;   // CHF/year (2nd pillar)
  pillarRate: number;           // e.g. 0.015
  ageRetirement: number;        // 2nd pillar unlock age (e.g. 65)
  initialPillar: number;        // current 2nd pillar balance
}

export interface AccumulationRow {
  year: number;         // year index starting at 1
  age: number;
  portfolio: number;
  pillar: number;
  totalWealth: number;
  totalInvested: number;
  totalGain: number;
}

export interface AccumulationResult {
  rows: AccumulationRow[];
  portfolioAtFire: number;
  pillarAtFire: number;
  totalWealthAtFire: number;
}

export interface DecumulationInputs {
  startingPortfolio: number;    // fed from Phase 1
  pillarAtFire: number;         // fed from Phase 1 — grows at pillarRate until unlock
  pillarRate: number;           // fed from Phase 1 — BVG rate continues on locked balance
  pillarUnlockYear: number;     // ageRetirement - ageFire, e.g. 16
  ageFire: number;
  // AHV/AVS
  ahvAnnual: number;            // CHF/year, 0 if not modeled
  ahvUnlockYear: number;        // 65 - ageFire
  // Spend & rates
  annualBudget: number;         // CHF/year (initial)
  returnRate: number;           // e.g. 0.04
  inflationRate: number;        // e.g. 0.02
  inflationAdjust: boolean;
  flatMode: boolean;            // 0% return, 0% inflation
  maxYears: number;             // safety cap, e.g. 60
}

export interface DecumulationRow {
  year: number;
  age: number;               // end-of-year age
  totalBudget: number;       // target spend (before AHV offset)
  portfolioDraw: number;     // actual draw from portfolio (totalBudget - ahvOffset)
  portfolioStart: number;    // portfolio after lump sums added, before growth/withdrawal
  portfolioEnd: number;
  lockedPillar: number;      // 2P balance still locked (0 after unlock year)
  totalWealth: number;       // portfolioEnd + lockedPillar
  withdrawalRate: number;    // portfolioDraw / portfolioStart
  note: string;              // "drawing" | "2P unlocked" | "AHV starts" | "depleted"
}

export interface DecumulationResult {
  rows: DecumulationRow[];
  initialWithdrawalRate: number;
  withdrawalRateAfterPillar: number | null;
  withdrawalRateAfterAhv: number | null;
  longevityYears: number | null;   // null = never depleted within maxYears
}

// ─── Decumulation config (lifted to App so URL + scenarios can access it) ────

export interface DecConfig {
  annualBudget: number;
  returnRate: number;
  inflationRate: number;
  inflationAdjust: boolean;
  flatMode: boolean;
  ahvMonthly: number;
}

// ─── Scenario snapshots ───────────────────────────────────────────────────────

export interface SavedScenario {
  id: number;
  label: string;
  color: string;
  accInputs: AccumulationInputs;
  decConfig: DecConfig;
  portfolioAtFire: number;
  pillarAtFire: number;
  totalWealthAtFire: number;
  initialWR: number;
  longevityYears: number | null;
  successRate: number | null;
}

// ─── Monte Carlo ──────────────────────────────────────────────────────────────

export interface MCBand {
  age: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface MCResult {
  successRate: number;
  bands: MCBand[];
  numSims: number;
}
