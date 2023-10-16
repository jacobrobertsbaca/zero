import { Draft, produce } from "immer";
import { isEqual, isEqualWith } from "lodash";
import { Budget } from "../budget/types";
import { moneyAllocate, moneyFactor, moneySub, moneySum, moneyZero } from "../money/methods";
import { Money } from "../money/types";
import { datesClamp, datesContains, datesDays, asDate, asDateString, dateFormat } from "../utils/methods";
import { Dates, DateString } from "../utils/types";
import { Category, CategoryType, Period, Recurrence, RecurrenceType, RolloverMode, TruncateMode } from "./types";

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

/* NOTE: Category periods always will have the format

 *        [EARLIER]
 *        [period 1]
 *        [period 2]
 *          ...
 *        [period n]
 *        [LATER]
 * 
 * For n >= 1. In other words, there are always at least three periods,
 * with the first period representing expenses before the budget
 * and the last period representing expenses after the budget.
 */

/**
 * Computes and returns the total nominal amount of a category.
 */
export const categoryNominal = (category: Category): Money => {
  return moneySum(...category.periods.map((p) => p.nominal));
};

/**
 * Computes and returns the total actual amount of a category.
 */
export const categoryActual = (category: Category): Money => {
  return moneySum(...category.periods.map((p) => p.actual));
};

/**
 * Called to set total nominal value of a category.
 */
export const onCategoryNominal = (category: Category, total: Money): Category =>
  produce(category, (draft) => {
    // Edge case: What if every period is omitted? Then sum of weights will be zero.
    // If so, we will change one of the 'Omit's to 'Keep' before continuing.
    if (draft.periods.every((p) => p.truncate === TruncateMode.Omit)) {
      const omitIndex = draft.periods.findIndex((p, i) => i !== 0 && p.truncate == TruncateMode.Omit);
      draft.periods[omitIndex].truncate = TruncateMode.Keep;
    }

    // Allocate total amount among all periods according to their multiplier
    const weights = draft.periods.map((p) => periodMultiplier(p));
    const amounts = moneyAllocate(total, weights);
    for (let i = 0; i < amounts.length; i++) draft.periods[i].nominal = amounts[i];

    // Set recurring amount according to first non-zero weight
    const index = weights.findIndex((w) => w > 0);
    draft.recurrence.amount = moneyFactor(amounts[index], 1 / weights[index]);
  });

export const categoryRollover = (category: Category): Money[] => {
  const active = categoryActiveIndex(category);

  // Calculate remaining amount.
  // If positive, we spent LESS than we planned.
  // If negative, we spent MORE than we planned.
  let remaining = moneyZero();
  for (let i = 0; i < active; i++) {
    const period = category.periods[i];
    remaining = moneySum(remaining, moneySub(period.nominal, period.actual));
  }

  const handleRollover = (remaining: Money, mode: RolloverMode): Money[] => {
    switch (mode) {
      case RolloverMode.None: return category.periods.map(_ => moneyZero());
      case RolloverMode.Average:
        // Average across future periods according to multiplier
        const weights = category.periods.map((p, i) => i >= active ? periodMultiplier(p) : 0);
        return moneyAllocate(remaining, weights);
    }
  };

  if (remaining.amount >= 0) return handleRollover(remaining, category.rollover.surplus);
  else return handleRollover(remaining, category.rollover.loss);
};

export const categorySort = <T>(selector: (e: T) => CategoryType): ((a: T, b: T) => number) => {
  const order: Record<CategoryType, number> = {
    [CategoryType.Income]: 0,
    [CategoryType.Investments]: 1,
    [CategoryType.Spending]: 2,
    [CategoryType.Savings]: 3,
  };

  return (a, b) => order[selector(a)] - order[selector(b)];
};

export const categoryTitle = (type: CategoryType): string => {
  const titles: Record<CategoryType, string> = {
    [CategoryType.Income]: "Income",
    [CategoryType.Investments]: "Investments",
    [CategoryType.Savings]: "Savings",
    [CategoryType.Spending]: "Spending",
  };
  return titles[type];
};

export const categoryActiveIndex = (category: Category, today?: Date | DateString): number => {
  if (!today) today = new Date();
  today = asDate(today);

  for (let i = 0; i < category.periods.length; i++) {
    if (datesContains(category.periods[i].dates, today)) return i;
  }

  return -1;
};

/**
 * Returns the currently active period within the given category.
 * @param category A category
 */
export const categoryActive = (category: Category, today?: Date | DateString): Period => {
  return category.periods[categoryActiveIndex(category, today)];
};

/**
 * Checks the category was edited. Does not consider actual amounts.
 * @param prev The old {@link Category}
 * @param next The new {@link Category}
 */
export const categoryDirty = (prev: Category, next: Category): boolean => {
  const { periods: prevPeriods, ...prevRest } = prev;
  const { periods: nextPeriods, ...nextRest } = next;
  return !isEqual(prevRest, nextRest) || !isEqualWith(prevPeriods, nextPeriods, (_, __, key) => {
    if (key === "actual") return true;
  });
};

/* ================================================================================================================= *
 * Recurrence                                                                                                        *
 * ================================================================================================================= */

/**
 * Called to change a category's {@link Category.recurrence}.
 */
export const onRecurrence = (budget: Budget, category: Category, recurrence: Recurrence): Category =>
  produce(category, (draft) => {
    // If there are no periods or the recurrence type has changed, reset periods
    if (draft.periods.length <= 2 || recurrence.type !== category.recurrence.type) {
      const resolver = getRangeResolver(budget, recurrence);
      draft.periods = resolveRanges(budget, resolver).map((dates) => ({
        dates: datesClamp(budget.dates, dates),
        days: datesDays(dates),
        nominal: moneyZero(),
        actual: moneyZero(),
        rollover: moneyZero(),
        truncate: TruncateMode.Keep,
      }));

      // Pad periods for earlier and later expenses (that fall before or after the budget dates)
      draft.periods.unshift({
        dates: {
          begin: asDateString(new Date(Date.parse("01 Jan 0000"))),
          end: asDateString(draft.periods[0].dates.begin, -1),
        },
        days: 0,
        nominal: moneyZero(),
        actual: moneyZero(),
        truncate: TruncateMode.Omit,
      });

      draft.periods.push({
        dates: {
          begin: asDateString(draft.periods[draft.periods.length - 1].dates.end, 1),
          end: asDateString(new Date(Date.parse("31 Dec 9999"))),
        },
        days: 0,
        nominal: moneyZero(),
        actual: moneyZero(),
        truncate: TruncateMode.Omit,
      });
    }

    // Update period nominal amounts
    for (const period of draft.periods)
      period.nominal = period.nominal = moneyFactor(draft.recurrence.amount, periodMultiplier(period));
    draft.recurrence = recurrence;
  });

/* ================================================================================================================= *
 * Period                                                                                                            *
 * ================================================================================================================= */

const periodMultiplier = (period: Period): number => {
  switch (period.truncate) {
    case TruncateMode.Keep:
      return 1.0;
    case TruncateMode.Split:
      return datesDays(period.dates) / period.days;
    case TruncateMode.Omit:
      return 0.0;
  }
};

/** Called when {@link Period.truncate} changes. */
export const onPeriodTruncate = (category: Category, period: Period, truncate: TruncateMode): Period => {
  return produce(period, (draft) => {
    draft.truncate = truncate;
    draft.nominal = moneyFactor(category.recurrence.amount, periodMultiplier(draft));
  });
};

export const periodDatesFormat = (period: Period): string => {
  const beginDate = dateFormat(period.dates.begin, { excludeYear: true });
  if (period.dates.begin === period.dates.end) return beginDate;
  const endDate = dateFormat(period.dates.end, { excludeYear: true });
  return `${beginDate} — ${endDate}`;
};