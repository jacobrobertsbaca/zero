import { Category, CategoryType } from "./category";
import { Money } from "./money";

export type BudgetSummarySnapshot = Record<CategoryType, Money>;

export type BudgetSummary = {
  nominal: BudgetSummarySnapshot;
  actual: BudgetSummarySnapshot;
};

export type Budget = {
  id: string;
  name: string;
  begin: Date;
  end: Date;
  summary: BudgetSummary;
  categories?: Category[];
};