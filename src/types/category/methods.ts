import { produce } from "immer";
import { Budget } from "../budget/types";
import { moneyAllocate, moneyFactor, moneySum, moneyZero } from "../money/methods";
import { Money } from "../money/types";
import { datesClamp, datesContains, datesDays, asDate, asDateString } from "../utils/methods";
import { Dates } from "../utils/types";
import {
  Category,
  Period,
  Recurrence,
  RecurrenceType,
  TruncateMode
} from "./types";

/* ================================================================================================================= *
 * Utility Methods                                                                                                   *
 * ================================================================================================================= */

type RangeResolver = (date: Date) => Dates;

const resolveRanges = (budget: Budget, resolver: RangeResolver): Dates[] => {
  let current = asDate(budget.dates.begin);
  const end = asDate(budget.dates.end);
  const ranges: Dates[] = [];
  while (current <= end) {
    const range = resolver(current);
    ranges.push(range);
    current = asDate(range.end, 1);
  }
  return ranges;
};

const getRangeResolver = (budget: Budget, recurrence: Recurrence): RangeResolver => {
  switch (recurrence.type) {
    case RecurrenceType.None:
      return (_) => budget.dates;
    case RecurrenceType.Weekly:
      return (date) => {
        const daysAfter = (date.getDay() - recurrence.day + 6) % 7;
        const daysBefore = (recurrence.day - date.getDay() + 7) % 7;
        return { begin: asDateString(date, -daysAfter), end: asDateString(date, daysBefore) };
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
        if (date > thisMonth) return { begin: asDateString(thisMonth, 1), end: asDateString(dayForMonth(1)) };
        return { begin: asDateString(dayForMonth(-1), 1), end: asDateString(thisMonth) };
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
export const onCategoryNominal = (budget: Budget, category: Category, total: Money): Category =>
  produce(category, (draft) => {
    // Edge case: What if every period is omitted? Then sum of weights will be zero.
    // If so, we will change one of the 'Omit's to 'Split' before continuing.
    if (draft.periods.every(p => p.truncate === TruncateMode.Omit)) {
      const omitIndex = draft.periods.findIndex(p => p.truncate == TruncateMode.Omit);
      draft.periods[omitIndex].truncate = TruncateMode.Split;
    }

    // Allocate total amount among all periods according to their multiplier
    const weights = draft.periods.map((p) => periodMultiplier(budget, p));
    const amounts = moneyAllocate(total, weights);
    for (let i = 0; i < amounts.length; i++) draft.periods[i].nominal = amounts[i];

    // Set recurring amount according to first non-zero weight
    const index = weights.findIndex(w => w > 0);
    draft.recurrence.amount = moneyFactor(amounts[index], 1 / weights[index]);
  });


/* ================================================================================================================= *
 * Recurrence                                                                                                        *
 * ================================================================================================================= */

/**
 * Called to change a category's {@link Category.recurrence}.
 */
export const onRecurrence = (
  budget: Budget, 
  category: Category, 
  recurrence: Recurrence
): Category => produce(category, (draft) => {
  // If there are no periods or the recurrence type has changed, reset periods
  if (draft.periods.length === 0 || recurrence.type !== category.recurrence.type) {
    const resolver = getRangeResolver(budget, recurrence);
    draft.periods = resolveRanges(budget, resolver).map((dates) => ({
      dates: dates,
      nominal: moneyZero()
    }));

    // Preserve period truncation on first and last periods
    if (draft.periods.length === 0) return;
    if (!datesContains(budget.dates, draft.periods[0].dates))
      draft.periods[0].truncate = category.periods[0]?.truncate ?? TruncateMode.Split;
    if (!datesContains(budget.dates, draft.periods[draft.periods.length - 1].dates))
      draft.periods[draft.periods.length - 1].truncate =
        category.periods[category.periods.length - 1]?.truncate ?? TruncateMode.Split;
  }

  // Update period nominal amounts
  for (const period of draft.periods)
    period.nominal = period.nominal = moneyFactor(draft.recurrence.amount, periodMultiplier(budget, period));
  draft.recurrence = recurrence;
});


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
 * Returns the number of *effective* days in {@link period}, which occurs in {@link budget}.
 */
export const periodDays = (budget: Budget, period: Period): number => {
  return datesDays(datesClamp(period.dates, budget.dates));
};
