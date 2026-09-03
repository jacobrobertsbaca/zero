import { Immutable } from "immer";
import { Category, CategoryType } from "../category/types";
import { Money } from "../money/types";
import { DateString, Dates } from "../utils/types";

export type Budget = Immutable<{
  id: string;
  name: string;
  dates: Dates;
  categories: Category[];
}>;

export type ActualNominal = Immutable<{
  actual: Money;
  nominal: Money | null;
}>;

export type CategorySummary = Immutable<
  ActualNominal & {
    /**
     * The {@link CategoryType} this summarizes.
     * If `undefined`, represents leftover amounts in the budget (i.e. unassigned income).
     */
    type?: CategoryType;

    /**
     * A human readable title for this category.
     */
    title: string;
  }
>;

export type BudgetSummary = Immutable<CategorySummary[]>;

export type BudgetTimelineAmounts = Immutable<Partial<Record<CategoryType, number>>>;

export type BudgetTimelinePoint = Immutable<{
  date: DateString;
  /** Cumulative amounts by category type, in minor currency units. */
  amounts: BudgetTimelineAmounts;
  /** Cumulative net (income − spending), in minor currency units. Investments/savings are excluded. */
  net: number;
}>;

export type BudgetTimeline = Immutable<{
  begin: DateString;
  end: DateString;
  points: BudgetTimelinePoint[];
}>;

export enum BudgetStatus {
  Active = 0,
  Future = 1,
  Past = 2,
}
