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

export type CategorySummary = Immutable<ActualNominal & {
  /**
   * The {@link CategoryType} this summarizes.
   * If `undefined`, represents leftover amounts in the budget (i.e. unassigned income).
   */
  type?: CategoryType;

  /**
   * A human readable title for this category.
   */
  title: string;
}>;

export type BudgetSummary = Immutable<CategorySummary[]>;

export enum BudgetStatus {
  Active = 0,
  Future = 1,
  Past = 2
};
