import { defaultCurrency } from "src/types/money/methods"
import { Money } from "src/types/money/types"

/**
 * Generates a random {@link Money}
 * @param low The minimum amount of minor units, inclusive.
 * @param hi The maximum amount of minor units, inclusive.
 * @param cur The currency. Defaults to {@link defaultCurrency}.
 * @returns A random {@link Money}.
 */
export const randomMoney = (low: number, hi: number, cur: string = defaultCurrency): Money => {
  const amount = Math.random() * (hi - low + 1) + low;
  return {
    amount: Math.floor(amount),
    currency: cur
  };
};