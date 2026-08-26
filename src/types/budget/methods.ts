import { produce } from "immer";
import { categoryActual, categoryNominal, categorySort, categoryTitle } from "../category/methods";
import { CategoryType } from "../category/types";
import { moneySub, moneySum, moneyZero } from "../money/methods";
import { Money } from "../money/types";
import {
  Budget,
  BudgetStatus,
  BudgetSummary,
  BudgetTimeline,
  BudgetTimelineAmounts,
  BudgetTimelinePoint,
  CategorySummary,
} from "./types";
import { DateString } from "../utils/types";
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
      title: "Net",
      actual: leftovers.actual,
      nominal: leftovers.nominal,
    });
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

/* ================================================================================================================= *
 * Timeline                                                                                                          *
 * ================================================================================================================= */

const timelineNet = (amounts: BudgetTimelineAmounts) =>
  (amounts[CategoryType.Income] ?? 0) - (amounts[CategoryType.Spending] ?? 0);

/** Latest date that should appear as data on an in-progress budget timeline. */
export const timelineAsOf = (
  begin: DateString,
  end: DateString,
  today: DateString = asDateString(new Date())
): DateString => {
  if (end < begin) return begin;
  if (today < begin) return begin;
  if (today < end) return today;
  return end;
};

/** Clamp a transaction date onto the visible timeline, or skip it. */
export const timelineBucketDate = (
  date: DateString,
  begin: DateString,
  end: DateString,
  pointEnd: DateString
): DateString | null => {
  const afterBudget = date > end;
  if (date < begin) date = begin;
  else if (afterBudget) date = end;

  if (date > pointEnd) {
    if (!afterBudget) return null;
    date = pointEnd;
  }
  return date;
};

/**
 * Cumulative income/spending timeline. Investments/savings are ignored.
 * Out-of-range amounts clamp onto begin/end (after-end also folds into as-of while active).
 */
export const buildBudgetTimeline = (
  begin: DateString,
  end: DateString,
  entries: readonly { date: DateString; type: CategoryType; amount: number }[],
  asOf: DateString = end
): BudgetTimeline => {
  const pointEnd = asOf < begin ? begin : asOf > end ? end : asOf;
  const byDate = new Map<DateString, Partial<Record<CategoryType, number>>>();

  for (const entry of entries) {
    if (entry.type === CategoryType.Investments || entry.type === CategoryType.Savings) continue;

    const date = timelineBucketDate(entry.date, begin, end, pointEnd);
    if (!date) continue;

    const cur = byDate.get(date) ?? {};
    byDate.set(date, { ...cur, [entry.type]: (cur[entry.type] ?? 0) + entry.amount });
  }

  const points: BudgetTimelinePoint[] = [];
  let cumulative: BudgetTimelineAmounts = {};

  const push = (date: DateString) => {
    points.push({ date, amounts: cumulative, net: timelineNet(cumulative) });
  };

  push(begin);

  for (const date of [...byDate.keys()].sort((a, b) => a.localeCompare(b))) {
    const next = { ...cumulative };
    for (const [type, delta] of Object.entries(byDate.get(date)!)) {
      if (delta === undefined) continue;
      const t = type as CategoryType;
      next[t] = (next[t] ?? 0) + delta;
    }
    cumulative = next;
    if (date === begin) points[0] = { date, amounts: cumulative, net: timelineNet(cumulative) };
    else push(date);
  }

  if (points.at(-1)?.date !== pointEnd) push(pointEnd);

  return { begin, end, points };
};
