import { produce } from "immer";
import { categoryActual, categoryNominal, categorySort } from "../category/methods";
import { CategoryType } from "../category/types";
import { moneySub, moneySum, moneyZero } from "../money/methods";
import { Money } from "../money/types";
import { Budget, BudgetSummary, CategorySummary } from "./types";

const computeLeftovers = (
  summaries: Partial<Record<CategoryType, CategorySummary>>,
  selector: (category: CategorySummary) => Money
): Money => {
  const nullSelector = (c?: CategorySummary) => c ? selector(c) : moneyZero();
  return moneySub(
    nullSelector(summaries.income),
    moneySum(
      nullSelector(summaries.investments),
      nullSelector(summaries.savings),
      nullSelector(summaries.spending)
    )
  );
};

export const budgetSummary = (budget: Budget): BudgetSummary => {
  const summaries: Partial<Record<CategoryType, CategorySummary>> = {};
  for (const category of budget.categories) {
    const type = category.type;
    const actual = categoryActual(category);
    const nominal = categoryNominal(category);
    const summary = summaries[category.type];

    if (!summary) summaries[category.type] = { type, actual, nominal };
    else summaries[category.type] = produce(summary, draft => {
      draft.actual = moneySum(draft.actual, actual);
      draft.nominal = moneySum(draft.nominal, nominal);
    });
  }

  const summariesList = Object.values(summaries);
  summariesList.sort(categorySort(cs => cs.type));

  /* Add leftovers to list of summaries */
  const leftovers = {
    type: null,
    nominal: computeLeftovers(summaries, c => c.nominal),
    actual: computeLeftovers(summaries, c => c.actual)
  };

  return {
    categories: summariesList.filter(s => s.actual.amount !== 0 || s.nominal.amount !== 0),
    leftovers: (leftovers.actual.amount !== 0 || leftovers.nominal.amount !== 0) ? leftovers : undefined
  };
};

export const budgetSummaryMerged = (budget: Budget, mergeInto: CategoryType): BudgetSummary => {
  const { categories, leftovers } = budgetSummary(budget);
  return {
    leftovers,
    categories: produce(categories, draft => {
      if (!leftovers) return;
      const { actual, nominal } = leftovers;
      const mergeIndex = draft.findIndex(cs => cs.type === mergeInto);
      if (mergeIndex >= 0) {
        draft[mergeIndex].actual = moneySum(draft[mergeIndex].actual, actual);
        draft[mergeIndex].nominal = moneySum(draft[mergeIndex].nominal, nominal);
      } else {
        draft.push({
          type: CategoryType.Savings,
          actual,
          nominal
        });
        draft.sort(categorySort(cs => cs.type));
      };
    })
  };
};