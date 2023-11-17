import { produce } from "immer";
import { resourceLimits } from "worker_threads";
import { Money } from "./types";

export const defaultCurrency = "USD";

export const moneyZero = (currency: string = defaultCurrency): Money => ({ amount: 0, currency: currency });

export const moneySum = (...moneys: Money[]) => {
  if (moneys.length === 0) return moneyZero();
  let amount = moneys[0].amount;
  const currency = moneys[0].currency;
  for (let i = 1; i < moneys.length; i++) {
    if (moneys[i].currency !== currency)
      throw new Error(
        `Cannot sum moneys with differing currencies: '${currency}' and '${moneys[i].currency}'`
      );
    amount += moneys[i].amount;
  }
  return { amount: amount, currency: currency };
};

/**
 * Computes and returns a - b.
 */
export const moneySub = (a: Money, b: Money): Money => {
  return moneySum(a, moneyFactor(b, -1));
};

/** Multiplies {@link money} by {@link factor} and returns the result.
 * Rounds to the nearest minor unit.
 */
export const moneyFactor = (money: Money, factor: number): Money => {
  if (factor === 1.0) return money;
  return { amount: Math.round(money.amount * factor), currency: money.currency };
}

/**
 * Returns the absolute value of the given amount.
 */
export const moneyAbs = (money: Money): Money => {
  return money.amount >= 0 ? money : moneyFactor(money, -1);
}

export const moneyAllocate = (money: Money, weights: number[]): Money[] => {
  if (weights.length === 0) return [];

  const total = weights.reduce((total, w) => total + w, 0);
  if (total === 0) return weights.map(_ => moneyZero());
  let remainder = money.amount;
  const amounts = weights.map(w => Math.trunc(money.amount * w / total));
  remainder -= amounts.reduce((total, a) => total + a, 0);
  
  // Distribute remainder among all non-zero parties
  let i = 0;
  while (remainder !== 0) {
    if (weights[i] !== 0) {
      const inc = Math.sign(remainder);
      amounts[i] += inc;
      remainder -= inc;
    }
    i = (i + 1) % weights.length;
  }
  return amounts.map(amount => ({amount, currency: money.currency}));
}

export enum RoundingMode {
  /**
   * Round to the nearest dollar.
   */
  Round,

  /**
   * Round to the nearest dollar unless doing so results in zero dollars for a non-zero input.
   */
  RoundZero,
}

export type MoneyFormatOptions = {
  /**
   * Whether to round amounts.
   */
  round?: RoundingMode;

  /**
   * Include a plus symbol (+) for positive amounts.
   */
  plus?: boolean;

  /**
   * Exclude the currency symbol.
   */
  excludeSymbol?: boolean;
};

export const moneyFormat = (money: Money, options?: MoneyFormatOptions): string => {
  const { round, plus, excludeSymbol } = options ?? { };
  const mag   = Math.abs(money.amount);
  const major = Math.floor(mag / 100);
  const minor = mag % 100;

  const addPrefix = (repr: string, amount: number): string => {
    const sym = excludeSymbol ? "" : "$";
    if (amount > 0) return `${plus ? "+" : ""}${sym}${repr}`;
    if (amount == 0) return `${sym}${repr}`;
    return `-${sym}${repr}`;
  }

  // Note: Currently this only works for USD
  switch (round) {
    case undefined:
      return addPrefix(`${major}.${minor.toString().padStart(2, "0")}`, money.amount);
    case RoundingMode.RoundZero:
    case RoundingMode.Round:
      if (round === RoundingMode.RoundZero && mag < 50 && mag > 0)
        return addPrefix(`0.${mag.toString().padStart(2, "0")}`, money.amount);
      const rounded = major + (minor >= 50 ? 1 : 0);
      return addPrefix(rounded.toString(), Math.sign(money.amount) * rounded);
  }
};