import { produce } from "immer";
import { categoryActual, categoryNominal, categorySort, categoryTitle } from "../category/methods";
import { CategoryType } from "../category/types";
import { moneySub, moneySum, moneyZero } from "../money/methods";
import { Money } from "../money/types";
import { Budget, BudgetStatus, BudgetSummary, CategorySummary } from "./types";
import { asDate, asDateString } from "../utils/methods";

const computeLeftovers = (
  summaries: Partial<Record<CategoryType, CategorySummary>>,
  selector: (category: CategorySummary) => Money
): Money => {
  const nullSelector = (c?: CategorySummary) => (c ? selector(c) : moneyZero());
  return moneySub(
    nullSelector(summaries.income),
    moneySum(nullSelector(summaries.investments), nullSelector(summaries.savings), nullSelector(summaries.spending))
  );
};

export const budgetSummary = (budget: Budget): BudgetSummary => {
  const summaries: Partial<Record<CategoryType, CategorySummary>> = {};
  for (const category of budget.categories) {
    const type = category.type;
    const actual = categoryActual(category);
    const nominal = categoryNominal(category);
    const summary = summaries[category.type];

    if (!summary) summaries[category.type] = { type, actual, nominal, title: categoryTitle(type) };
    else
      summaries[category.type] = produce(summary, (draft) => {
        draft.actual = moneySum(draft.actual, actual);
        draft.nominal = moneySum(draft.nominal, nominal);
      });
  }

  const summariesList = Object.values(summaries);
  summariesList.sort(categorySort((cs) => cs.type!));

  const leftovers = {
    nominal: computeLeftovers(summaries, (c) => c.nominal),
    actual: computeLeftovers(summaries, (c) => c.actual),
  };

  if (leftovers.actual.amount !== 0 || leftovers.nominal.amount !== 0) {
    summariesList.push({
      title: "Leftovers",
      actual: leftovers.actual,
      nominal: leftovers.nominal
    })
  }

  return summariesList;
};

export const budgetStatus = (budget: Budget): BudgetStatus => {
  const today = asDate(new Date());
  if (asDate(budget.dates.end) < today) return BudgetStatus.Past;
  if (asDate(budget.dates.begin) > today) return BudgetStatus.Future;
  return BudgetStatus.Active;
};

// Sorts budgets in this order:
// (1) Active budgets: Soonest end date comes first
// (2) Future budgets: Soonest start date comes first
// (3) Past budgets: Most recent end date comes first
export const budgetCompare = (a: Budget, b: Budget): number => {
  const aStatus = budgetStatus(a);
  const bStatus = budgetStatus(b);
  if (aStatus !== bStatus) return aStatus - bStatus;
  switch (aStatus) {
    case BudgetStatus.Active:
      return a.dates.end.localeCompare(b.dates.end);
    case BudgetStatus.Future:
      return a.dates.begin.localeCompare(b.dates.begin);
    case BudgetStatus.Past:
      return b.dates.end.localeCompare(a.dates.end);
  }
};

export const budgetMaxYears = (): number => 10;
export const budgetMaxDays = (): number => 365 * budgetMaxYears();
