import { Immutable } from "immer";
import { Money } from "../money/types";
import { Dates } from "../utils/types";

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

export enum RecurrenceType {
  None = "none",
  Weekly = "weekly",
  Monthly = "monthly",
}

export type NoRecurrence = Immutable<{ type: RecurrenceType.None }>;
export type WeeklyRecurrence = Immutable<{ type: RecurrenceType.Weekly; day: number }>;
export type MonthlyRecurrence = Immutable<{ type: RecurrenceType.Monthly; day: number }>;
export type Recurrence = Immutable<
  { amount: Money } & (NoRecurrence | WeeklyRecurrence | MonthlyRecurrence)
>;

export type Period = Immutable<{
  /**
   * The dates contained in this period.
   * This value may exceed the dates defined in its containing budget (they are not truncated).
   * */
  dates: Dates;
  nominal: Money;
  actual: Money;
  truncate?: TruncateMode;
}>;

export type Category = Immutable<{
  id: string;
  name: string;
  type: CategoryType;
  recurrence: Recurrence;
  periods: Period[];
}>;
