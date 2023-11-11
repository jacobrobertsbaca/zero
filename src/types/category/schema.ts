import { z } from "zod";
import { Category, CategoryType, RecurrenceType, RolloverMode, TruncateMode } from "./types";
import { MoneySchema } from "../money/schema";
import { DatesSchema } from "../utils/schema";
import { asDate, asDateString, dateMax, dateMin, datesDays } from "../utils/methods";

/* ================================================================================================================= *
 * Validation Helpers                                                                                                *
 * ================================================================================================================= */

/**
 * Runs a course check on recurrence to avoid generating periods (slow)
 * if an attacker tries to pass bad periods.
 * @param category The category being verified
 * @returns `false` if the category is definitely invalid for the given recurrence.
 */
const courseRecurrenceCheck = (category: Category): boolean => {
  const { periods, recurrence } = category;
  switch (recurrence.type) {
    case RecurrenceType.None:
      return periods.length === 3;
    case RecurrenceType.Weekly:
      for (let i = 1; i < periods.length - 2; i++) {
        const period = periods[i];
        if (asDate(period.dates.end).getUTCDay() !== recurrence.day) return false;
      }

      for (let i = 1; i < periods.length - 1; i++) {
        if (datesDays(periods[i].dates) > 7) return false;
      }

      return true;

    case RecurrenceType.Monthly:
      for (let i = 1; i < periods.length - 2; i++) {
        const end = asDate(periods[i].dates.end);
        const lastDayOfMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getUTCDate();
        if (end.getUTCDate() !== Math.min(recurrence.day, lastDayOfMonth)) return false;
      }

      for (let i = 1; i < periods.length - 1; i++) {
        if (datesDays(periods[i].dates) > 31) return false;
      }

      return true;
  }
};

/* ================================================================================================================= *
 * Schemas                                                                                                           *
 * ================================================================================================================= */

const RecurrenceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal(RecurrenceType.None), amount: MoneySchema }),
  z.object({ type: z.literal(RecurrenceType.Weekly), amount: MoneySchema, day: z.number().min(0).max(6) }),
  z.object({ type: z.literal(RecurrenceType.Monthly), amount: MoneySchema, day: z.number().min(1).max(31) }),
]);

const PeriodSchema = z
  .object({
    dates: DatesSchema,
    days: z.number().min(0),
    nominal: MoneySchema,
    actual: MoneySchema,
    truncate: z.nativeEnum(TruncateMode),
  })
  .refine((value) => {
    if (value.truncate === TruncateMode.Split) return (value.days !== datesDays(value.dates));
    return true;
  }, "Only truncated periods may be split");

export const CategorySchema = z
  .object({
    id: z.string(),
    name: z.string().trim().min(1).max(60),
    type: z.nativeEnum(CategoryType),
    recurrence: RecurrenceSchema,
    periods: PeriodSchema.array().min(3),
    rollover: z.object({
      loss: z.nativeEnum(RolloverMode),
      surplus: z.nativeEnum(RolloverMode),
    }),
  })
  .refine((value) => {
    // Check that all periods are back to back
    if (!value.periods.every((p, i) => i === 0 || p.dates.begin === asDateString(value.periods[i - 1].dates.end, 1)))
      return false;

    // Check first and last periods (these are special)
    const first = value.periods[0];
    const last = value.periods[value.periods.length - 1];
    if (first.truncate !== TruncateMode.Omit) return false;
    if (last.truncate !== TruncateMode.Omit) return false;
    if (first.dates.begin !== dateMin() || first.days !== 0) return false;
    if (last.dates.end !== dateMax() || last.days !== 0) return false;

    // Do a course check on recurrence
    if (!courseRecurrenceCheck(value)) return false;

    // Check that internal periods have days equal to their dates
    for (let i = 2; i < value.periods.length - 2; i++) {
      if (value.periods[i].days !== datesDays(value.periods[i].dates)) return false;
    }

    // TODO: Do a rigorous check on periods using onRecurrence

    return true;
  }, "Invalid periods for specified recurrence");
