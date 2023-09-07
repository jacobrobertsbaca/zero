import { Immutable } from "immer";
import { Category, CategoryType } from "../category/types";
import { Money } from "../money/types";
import { Dates } from "../utils/types";

export type BudgetSummarySnapshot = Record<CategoryType, Money>;

export type BudgetSummary = Immutable<{
  nominal: BudgetSummarySnapshot;
  actual: BudgetSummarySnapshot;
}>;

export type Budget = Immutable<{
  id: string;
  name: string;
  dates: Dates;
  summary: BudgetSummary;
  categories?: Category[];
}>;
