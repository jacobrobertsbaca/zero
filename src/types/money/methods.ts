import { Money } from "./types";

export const moneyZero = (currency: string = "USD"): Money => ({ amount: 0, currency: currency });
