import { Category, CategoryType } from "./category";
import { Money } from "./money";

export class BudgetSnapshot implements Record<CategoryType, Money> {
  income!: Money;
  savings!: Money;
  investments!: Money;
  spending!: Money;
};

export class BudgetSummary {
  nominal!: BudgetSnapshot;
  actual!: BudgetSnapshot;
};

export class Budget {
  id!: string;
  name!: string;
  begin!: Date;
  end!: Date;
  summary!: BudgetSummary;
  categories?: Category[];
};