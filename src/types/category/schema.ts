import * as Yup from "yup";
import { Category, CategoryType, Period, Recurrence, RecurrenceType, RolloverMode, TruncateMode } from "./types";
import { enumSchema, valueSchema } from "src/utils/schema";
import { moneySchema } from "../money/schema";
import { datesSchema } from "../utils/schema";
import { asDateString, dateMax, dateMin, datesDays } from "../utils/methods";
import { isEqualWith, isMatch, split } from "lodash";
import { Budget } from "../budget/types";
import { DateString } from "../utils/types";
import { onRecurrence } from "./methods";

/* ================================================================================================================= *
 * Helper Functions                                                                                                  *
 * ================================================================================================================= */

/* ================================================================================================================= *
 * Schemas                                                                                                           *
 * ================================================================================================================= */

export const noRecurrenceSchema = Yup.object({
  type: valueSchema(RecurrenceType.None).required(),
  amount: moneySchema().required()
});

export const weeklyRecurrenceSchema = Yup.object({
  type: valueSchema(RecurrenceType.Weekly).required(),
  amount: moneySchema().required(),
  day: Yup.number().integer().min(0).max(6).required()
});

export const monthlyRecurrenceSchema = Yup.object({
  type: valueSchema(RecurrenceType.Monthly).required(),
  amount: moneySchema().required(),
  day: Yup.number().integer().min(1).max(31).required()
});

export const recurrenceSchema = () => Yup.lazy(value => {
  switch (value?.type) {
    case RecurrenceType.None: return noRecurrenceSchema;
    case RecurrenceType.Weekly: return weeklyRecurrenceSchema;
    case RecurrenceType.Monthly: return monthlyRecurrenceSchema;
    default: return Yup.mixed().test(_ => false); // Reject all if not one of defined types
  }
});

export const periodSchema = () => Yup.object({
  dates: datesSchema().required(),
  days: Yup.number().integer().min(0).required(),
  nominal: moneySchema().required(),
  actual: moneySchema().required(),
  truncate: enumSchema(TruncateMode).required()
}).test(
  "split-truncate",
  `\${path} can only be set to "${TruncateMode.Split}" for truncated periods`,
  value => {
    if (value.truncate == TruncateMode.Split)
      return value.days != datesDays(value.dates);
    return true;
  }
);

const referencePeriods = (begin: DateString, end: DateString, recurrence: Recurrence): readonly Period[] => {
  const budget = { dates: { begin, end }} as Budget;
  let category = { recurrence, periods: [] } as unknown as Category;
  category = onRecurrence(budget, category, recurrence);
  return category.periods;
};

export const categorySchema = () => Yup.object({
  // `id` defined but not required to allow empty string
  id: Yup.string().defined(),
  name: Yup.string().required(),
  type: enumSchema(CategoryType).required(),
  recurrence: recurrenceSchema(),
  periods: Yup.array(periodSchema().required()).min(3).required()
    .test("first-last", "${path} must begin and end with special periods", (value, ctx) => {
      const first = value[0];
      const last = value[value.length - 1];

      if (first.truncate !== TruncateMode.Omit)
        return ctx.createError({ 
          message: `${ctx.path}[0].truncate must be "${TruncateMode.Omit}"` 
        });

      if (last.truncate !== TruncateMode.Omit)
        return ctx.createError({ 
          message: `${ctx.path}[${value.length - 1}].truncate must be "${TruncateMode.Omit}"` 
        });

      return true;
    })
    .test("split-truncate", `Only truncated periods can be marked with truncate: '${TruncateMode.Split}'`, (value) => {
      return value.every(period => {
        if (period.truncate == TruncateMode.Split)
          return period.days != datesDays(period.dates);
        return true;
      })
    }),
  rollover: Yup.object({
    loss: enumSchema(RolloverMode).required(),
    surplus: enumSchema(RolloverMode).required()
  }),
}).test("recurrence", "Period dates do not match specified recurrence",
  (category, ctx) => {
    const begin = category.periods[1].dates.begin;
    const end = category.periods[category.periods.length - 2].dates.end;
    if (end < begin) return false;
    const reference = referencePeriods(begin, end, category.recurrence as Recurrence);
    if (!isEqualWith(category.periods, reference, (_, __, key) => {
      if (key === "nominal" || key === "actual" || key === "truncate")
        return true; // Ignore these keys
    })) {
      return ctx.createError({
        message: `Invalid periods for specified recurrence`
      });
    }
    return true;
  }); 