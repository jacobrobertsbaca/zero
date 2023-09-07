import { Immutable } from "immer";
import { Money } from "../money/types";
import { DateRange } from "../utils/types";

export enum CategoryType {
  Income = "income",
  Savings = "savings",
  Investments = "investments",
  Spending = "spending",
}

export enum TruncateMode {
  Omit = "omit",
  Split = "split",
  Keep = "keep",
}

export type NoRecurrence = Immutable<{ type: "none" }>;
export type WeeklyRecurrence = Immutable<{ type: "weekly"; day: 0 | 1 | 2 | 3 | 4 | 5 | 6 }>;
export type MonthlyRecurrence = Immutable<{ type: "monthly"; day: number }>;
export type Recurrence = Immutable<
  { amount: Money } & (NoRecurrence | WeeklyRecurrence | MonthlyRecurrence)
>;

export type Period = Immutable<{
  /**
   * The dates contained in this period.
   * This value may exceed the dates defined in its containing budget (they are not truncated).
   * */
  dates: DateRange;
  nominal: Money;
  actual: Money;
  truncate: TruncateMode;
}>;

export type Category = Immutable<{
  id: string;
  name: string;
  type: CategoryType;
  recurrence: Recurrence;
  periods: Period[];
}>;
