import { Immutable } from "immer";
import { Category, CategoryType } from "../category/types";
import { Money } from "../money/types";
import { Dates } from "../utils/types";

export type Budget = Immutable<{
  id: string;
  name: string;
  dates: Dates;
  categories: Category[];
}>;

export type ActualNominal = Immutable<{
  actual: Money;
  nominal: Money;
}>;

export type CategorySummary = ActualNominal & Immutable<{
  /**
   * The {@link CategoryType} this summarizes.
   * If null, represents leftover amounts in the budget (i.e. unassigned income).
   */
  type: CategoryType;
}>;

export type BudgetSummary = Immutable<{
  leftovers?: ActualNominal,
  categories: CategorySummary[]
}>;
