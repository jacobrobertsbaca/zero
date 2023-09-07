import { Immutable } from "immer";

export type Money = Immutable<{
  amount: number;
  currency: string;
}>;
