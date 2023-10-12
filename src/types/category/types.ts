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

export enum RolloverMode {
  /** Don't rollover this amount to future periods */
  None = "none",

  /** Average this amount across all future periods */
  Average = "average"
}

export type NoRecurrence = Immutable<{ type: RecurrenceType.None; amount: Money }>;
export type WeeklyRecurrence = Immutable<{
  type: RecurrenceType.Weekly;
  day: number;
  amount: Money;
}>;
export type MonthlyRecurrence = Immutable<{
  type: RecurrenceType.Monthly;
  day: number;
  amount: Money;
}>;
export type Recurrence = Immutable<NoRecurrence | WeeklyRecurrence | MonthlyRecurrence>;

export type Period = Immutable<{
  /**
   * The dates contained in this period.
   * This value is always truncated to fit within its containing budget,
   * except for the first and last padding periods.
   * */
  dates: Dates;

  /**
   * The true number of days in this period if it had not been truncated.
   */
  days: number;
  nominal: Money;
  actual: Money;

  /**
   * Amount rolled over from previous periods. Can be computed using {@link categoryRollover}.
   */
  rollover: Money;
  truncate: TruncateMode;
}>;

export type Category = Immutable<{
  id: string;
  name: string;
  type: CategoryType;
  recurrence: Recurrence;
  periods: Period[];
  rollover: {
    loss: RolloverMode,
    surplus: RolloverMode
  }
}>;
