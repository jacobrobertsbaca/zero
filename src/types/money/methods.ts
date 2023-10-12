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

export const moneyAllocate = (money: Money, weights: number[]): Money[] => {
  if (weights.length === 0) return [];

  const total = weights.reduce((total, w) => total + w, 0);
  let remainder = money.amount;
  if (total === 0) throw new Error("Sum of weights cannot be zero");
  const amounts = weights.map(w => {
    const amount = Math.round(money.amount * w / total); 
    remainder -= amount;
    return amount;
  });
  
  // Distribute remainder among all non-zero parties
  let i = 0;
  while (remainder > 0) {
    if (weights[i] === 0) continue;
    amounts[i]++;
    remainder--;
    i = (i + 1) % weights.length;
  }
  return amounts.map(amount => ({amount, currency: money.currency}));
}

export const moneyFormat = (money: Money, round: boolean = false): string => {
  // Note: Currently this only works for USD
  const mag   = Math.abs(money.amount);
  const minor = mag % 100;
  const major = Math.floor(mag / 100) + (round && minor >= 50 ? 1 : 0);
  const prefix = `${money.amount < 0 ? "–" : ""}$${major}`;
  if (round) return prefix;
  return `${prefix}.${minor.toString().padStart(2, "0")}`;
};