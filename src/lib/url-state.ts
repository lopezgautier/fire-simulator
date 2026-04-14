import type { AccumulationInputs, DecConfig } from './types';

const DEFAULT_ACC: AccumulationInputs = {
  initialCapital: 350_000, yearlySavings: 66_000, returnRate: 0.06,
  ageNow: 32, ageFire: 49, pillarContribution: 10_200, pillarRate: 0.015,
  ageRetirement: 65, initialPillar: 0,
};

const DEFAULT_DEC: DecConfig = {
  annualBudget: 80_000, returnRate: 0.04, inflationRate: 0.02,
  inflationAdjust: false, flatMode: false, ahvAnnual: 0,
};

export function encodeState(acc: AccumulationInputs, dec: DecConfig): string {
  const p = new URLSearchParams({
    ic: String(acc.initialCapital),
    ys: String(acc.yearlySavings),
    rr: String(acc.returnRate),
    an: String(acc.ageNow),
    af: String(acc.ageFire),
    pc: String(acc.pillarContribution),
    pr: String(acc.pillarRate),
    ar: String(acc.ageRetirement),
    ip: String(acc.initialPillar),
    ab: String(dec.annualBudget),
    dr: String(dec.returnRate),
    ir: String(dec.inflationRate),
    ia: dec.inflationAdjust ? '1' : '0',
    fm: dec.flatMode ? '1' : '0',
    ahv: String(dec.ahvAnnual),
  });
  return `${window.location.origin}${window.location.pathname}?${p.toString()}`;
}

export function decodeState(): { acc: AccumulationInputs; dec: DecConfig } | null {
  const p = new URLSearchParams(window.location.search);
  if (!p.has('ic') && !p.has('an') && !p.has('af')) return null;

  const n = (key: string, fallback: number) => {
    const v = parseFloat(p.get(key) ?? '');
    return isNaN(v) ? fallback : v;
  };
  const b = (key: string, fallback: boolean) =>
    p.has(key) ? p.get(key) === '1' : fallback;

  return {
    acc: {
      initialCapital: n('ic', DEFAULT_ACC.initialCapital),
      yearlySavings: n('ys', DEFAULT_ACC.yearlySavings),
      returnRate: n('rr', DEFAULT_ACC.returnRate),
      ageNow: n('an', DEFAULT_ACC.ageNow),
      ageFire: n('af', DEFAULT_ACC.ageFire),
      pillarContribution: n('pc', DEFAULT_ACC.pillarContribution),
      pillarRate: n('pr', DEFAULT_ACC.pillarRate),
      ageRetirement: n('ar', DEFAULT_ACC.ageRetirement),
      initialPillar: n('ip', DEFAULT_ACC.initialPillar),
    },
    dec: {
      annualBudget: n('ab', DEFAULT_DEC.annualBudget),
      returnRate: n('dr', DEFAULT_DEC.returnRate),
      inflationRate: n('ir', DEFAULT_DEC.inflationRate),
      inflationAdjust: b('ia', DEFAULT_DEC.inflationAdjust),
      flatMode: b('fm', DEFAULT_DEC.flatMode),
      ahvAnnual: n('ahv', DEFAULT_DEC.ahvAnnual),
    },
  };
}

export { DEFAULT_ACC, DEFAULT_DEC };
