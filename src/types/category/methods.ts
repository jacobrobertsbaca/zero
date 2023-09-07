import { Immutable, produce } from "immer";
import { Budget } from "../budget/types";
import { moneyZero } from "../money/methods";
import { datesContains } from "../utils/methods";
import { Dates } from "../utils/types";
import { Category, Period, RecurrenceType, TruncateMode } from "./types";

const PERIOD_PRODUCERS: Immutable<Record<RecurrenceType, (budgetDates: Dates) => Dates[]>> = {
  [RecurrenceType.None]: (dates) => [],
  [RecurrenceType.Weekly]: (dates) => [],
  [RecurrenceType.Monthly]: (dates) => [],
};

/**
 * Given a {@link Budget} and a {@link Category}, returns a {@link Category}
 * from the old one with {@link Category.periods} set correctly.
 *
 * Uses {@link Category.recurrence} to determine which periods should
 * appear in the resulting {@link Category}. Each period will have its
 * nominal value set properly according to {@link Period.truncate}.
 *
 * {@link Period.truncate} will only apply to those periods which are the
 * same across this transformation, and only then to periods that are
 * actually truncated. Otherwise, {@link Period.truncate} will be ignored.
 *
 * {@link Period.actual} will be set to zero for all periods.
 */
export const categoryPeriods = (budget: Budget, category: Category): Category => {
  const oldPeriods = category.periods;
  return produce(category, (draft) => {
    const periods: Period[] = PERIOD_PRODUCERS[draft.recurrence.type](budget.dates).map(
      (dates) => ({
        dates: dates,
        nominal: moneyZero(),
        actual: moneyZero(),
        truncate: !datesContains(budget.dates, dates) ? TruncateMode.Keep : undefined,
      })
    );
    draft.periods = periods;
  });
};
