import { produce } from "immer";
import { Budget } from "../budget/types";
import { moneyAllocate, moneyFactor, moneySum, moneyZero } from "../money/methods";
import { Money } from "../money/types";
import { datesClamp, datesContains, datesDays, fixDate } from "../utils/methods";
import { Dates } from "../utils/types";
import {
  Category,
  MonthlyRecurrence,
  Period,
  Recurrence,
  RecurrenceType,
  TruncateMode,
  WeeklyRecurrence,
} from "./types";

/* ================================================================================================================= *
 * Utility Methods                                                                                                   *
 * ================================================================================================================= */

type RangeResolver = (date: Date) => Dates;

const resolveRanges = (budget: Budget, resolver: RangeResolver): Dates[] => {
  let current = fixDate(budget.dates.begin);
  const end = fixDate(budget.dates.end, 1);
  const ranges: Dates[] = [];
  while (current < end) {
    const range = resolver(current);
    ranges.push(range);
    current = fixDate(range.end, 1);
  }
  return ranges;
};

const getRangeResolver = (budget: Budget, category: Category): RangeResolver => {
  const recurrence: Recurrence = category.recurrence;
  switch (recurrence.type) {
    case RecurrenceType.None:
      return (date) => budget.dates;
    case RecurrenceType.Weekly:
      return (date) => {
        const daysAfter = (date.getDay() - recurrence.day + 6) % 7;
        const daysBefore = (recurrence.day - date.getDay() + 7) % 7;
        return { begin: fixDate(date, -daysAfter), end: fixDate(date, daysBefore) };
      };
    case RecurrenceType.Monthly:
      return (date) => {
        /* Returns a date representing the recurrence deadline for a given month.
         * E.g. month = -1 represents last month, 0 this month, 1 next month.
         * Clamps to the last day in that month. E.g. if `recurrence.day` is 31
         * and we are in February, clamps to February 28th */
        const dayForMonth = (month: number) => {
          const day = new Date(date.getFullYear(), date.getMonth() + month, recurrence.day);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1 + month, 0);
          if (day > monthEnd) return monthEnd;
          return day;
        };

        const thisMonth = dayForMonth(0);
        if (date > thisMonth) return { begin: fixDate(thisMonth, 1), end: dayForMonth(1) };
        return { begin: fixDate(dayForMonth(-1), 1), end: thisMonth };
      };
  }
};

/* ================================================================================================================= *
 * Category                                                                                                          *
 * ================================================================================================================= */

/**
 * Computes and returns the total nominal amount of a category.
 */
export const categoryNominal = (category: Category): Money => {
  return moneySum(...category.periods.map((p) => p.nominal));
};

/**
 * Called to set total nominal value of a category.
 */
export const onCategoryNominal = (budget: Budget, category: Category, total: Money): Category => {
  // Allocate total amount among all periods according to their multiplier
  const weights = category.periods.map((p) => periodMultiplier(budget, p));
  const amounts = moneyAllocate(total, weights);

  return produce(category, (draft) => {
    for (let i = 0; i < amounts.length; i++) draft.periods[i].nominal = amounts[i];

    // Set recurring amount accordingly
    draft.recurrence.amount = moneyFactor(amounts[0], 1 / weights[0]);
  });
};

/* ================================================================================================================= *
 * Recurrence                                                                                                        *
 * ================================================================================================================= */

/**
 * Called when a category's {@link Recurrence.type} changes.
 *
 * Will preserve:
 *  - Total nominal value of category
 *  - Whether to truncate first and last period
 */
export const onRecurrenceType = (budget: Budget, category: Category): Category => {
  const nominal = categoryNominal(category);
  const next = produce(category, (draft) => {
    const resolver = getRangeResolver(budget, category);
    draft.periods = resolveRanges(budget, resolver).map((dates) => ({
      dates: dates,
      nominal: moneyZero(),
      actual: moneyZero(),
    }));

    // Preserve period truncation on first and last periods
    if (draft.periods.length === 0) return;
    if (!datesContains(budget.dates, draft.periods[0].dates))
      draft.periods[0].truncate = category.periods[0]?.truncate ?? TruncateMode.Keep;
    if (!datesContains(budget.dates, draft.periods[draft.periods.length - 1].dates))
      draft.periods[draft.periods.length - 1].truncate =
        category.periods[category.periods.length - 1]?.truncate ?? TruncateMode.Omit;
  });

  // Preserve the total nominal amount of the period
  return onCategoryNominal(budget, next, nominal);
};

/**
 * Called when a category's {@link Recurrence.amount} changes.
 */
export const onRecurrenceAmount = (budget: Budget, category: Category, amount: Money): Category => {
  return produce(category, (draft) => {
    draft.recurrence.amount = amount;
    for (const period of draft.periods) period.nominal = moneyFactor(amount, periodMultiplier(budget, period));
  });
};

/* ================================================================================================================= *
 * Period                                                                                                            *
 * ================================================================================================================= */

const periodMultiplier = (budget: Budget, period: Period): number => {
  if (datesContains(budget.dates, period.dates)) return 1.0;
  if (!period.truncate) throw new Error(`Truncated period did not have truncate defined.`);
  switch (period.truncate) {
    case TruncateMode.Keep:
      return 1.0;
    case TruncateMode.Split:
      return periodDays(budget, period) / datesDays(period.dates);
    case TruncateMode.Omit:
      return 0.0;
  }
};

/** Called when {@link Period.truncate} changes. */
export const onPeriodTruncate = (budget: Budget, category: Category, period: Period): Period => {
  return produce(period, (draft) => {
    draft.nominal = moneyFactor(category.recurrence.amount, periodMultiplier(budget, draft));
  });
};

/**
 * Returns the number of *effective* days in {@link period}, which occurs in {@link Budget}.
 */
export const periodDays = (budget: Budget, period: Period): number => {
  return datesDays(datesClamp(period.dates, budget.dates));
};
