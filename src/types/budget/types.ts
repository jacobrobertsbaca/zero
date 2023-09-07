import { Category, CategoryType } from "../category/types";
import { Money } from "../money/types";
import { DateRange } from "../utils/types";

export type BudgetSummarySnapshot = Record<CategoryType, Money>;

export type BudgetSummary = {
  nominal: BudgetSummarySnapshot;
  actual: BudgetSummarySnapshot;
};

export type Budget = {
  id: string;
  name: string;
  dates: DateRange,
  summary: BudgetSummary;
  categories?: Category[];
};