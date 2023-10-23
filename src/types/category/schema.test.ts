import { fails, passes } from "src/utils/schema";
import { categorySchema, monthlyRecurrenceSchema, noRecurrenceSchema, periodSchema, recurrenceSchema, weeklyRecurrenceSchema } from "./schema";
import { Category, CategoryType, RecurrenceType, RolloverMode, TruncateMode } from "./types";
import { defaultCurrency, moneyZero } from "../money/methods";
import { dateMax, dateMin } from "../utils/methods";
import { produce } from "immer";

/* ================================================================================================================= *
 * Recurrence Schemas                                                                                                *
 * ================================================================================================================= */

test("No recurrence", () => {
  const schema = noRecurrenceSchema;

  passes(schema, {
    type: RecurrenceType.None,
    amount: moneyZero()
  });

  fails(schema, {
    type: RecurrenceType.Monthly,
    amount: moneyZero()
  });

  fails(schema, { amount: moneyZero() });
  fails(schema, { type: RecurrenceType.None });
});

test("Weekly recurrence", () => {
  const schema = weeklyRecurrenceSchema;

  passes(schema, {
    type: RecurrenceType.Weekly,
    amount: moneyZero(),
    day: 0
  });

  passes(schema, {
    type: RecurrenceType.Weekly,
    amount: moneyZero(),
    day: 6
  });

  fails(schema, {
    type: RecurrenceType.Weekly,
    amount: moneyZero(),
    day: -1
  });

  fails(schema, {
    type: RecurrenceType.Weekly,
    amount: moneyZero(),
    day: 7
  });

  fails(schema, {
    type: RecurrenceType.Weekly,
    amount: moneyZero(),
    day: 1.5
  });

  fails(schema, { amount: moneyZero() });
  fails(schema, { type: RecurrenceType.Weekly });
  fails(schema, { day: 0 });
});

test("Monthly recurrence", () => {
  const schema = monthlyRecurrenceSchema;

  passes(schema, {
    type: RecurrenceType.Monthly,
    amount: moneyZero(),
    day: 1
  });

  passes(schema, {
    type: RecurrenceType.Monthly,
    amount: moneyZero(),
    day: 31
  });

  fails(schema, {
    type: RecurrenceType.Monthly,
    amount: moneyZero(),
    day: 0
  });

  fails(schema, {
    type: RecurrenceType.Monthly,
    amount: moneyZero(),
    day: 32
  });

  fails(schema, {
    type: RecurrenceType.Monthly,
    amount: moneyZero(),
    day: 1.5
  });

  fails(schema, { amount: moneyZero() });
  fails(schema, { type: RecurrenceType.Monthly });
  fails(schema, { day: 0 });
});

test("All recurrence schemas", () => {
  const schema = recurrenceSchema();

  passes(schema, {
    type: RecurrenceType.None,
    amount: moneyZero()
  });

  passes(schema, {
    type: RecurrenceType.Weekly,
    amount: moneyZero(),
    day: 0
  });

  passes(schema, {
    type: RecurrenceType.Monthly,
    amount: moneyZero(),
    day: 1
  });

  /* This should pass because unknown keys shouldn't not cause validation failures */
  passes(schema, {
    type: RecurrenceType.None,
    amount: moneyZero(),
    day: 1
  });

  fails(schema, { amount: moneyZero() });
  fails(schema, { type: RecurrenceType.Monthly });
  fails(schema, { day: 0 });
});

test("Expect recurrence schema strips unknown", async () => {
  const schema = recurrenceSchema();
  expect(
    await schema.validate({ type: RecurrenceType.None, amount: moneyZero(), day: 0 }, { stripUnknown: true })
  ).toEqual({ type: RecurrenceType.None, amount: moneyZero() });
});

/* ================================================================================================================= *
 * Period Schemas                                                                                                    *
 * ================================================================================================================= */

test("Period schema passes", () => {
  const schema = periodSchema();

  passes(schema, {
    dates: { begin: "20231022", end: "20231023" },
    days: 1,
    nominal: moneyZero(),
    actual: moneyZero(),
    truncate: TruncateMode.Keep
  });

  passes(schema, {
    dates: { begin: "20231022", end: "20231023" },
    days: 1,
    nominal: moneyZero(),
    actual: moneyZero(),
    truncate: TruncateMode.Split
  });
});

test("Period schema fails", () => {
  const schema = periodSchema();

  // Period with negative days
  fails(schema, {
    dates: { begin: "20231022", end: "20231023" },
    days: -1,
    nominal: moneyZero(),
    actual: moneyZero(),
    truncate: TruncateMode.Keep
  });

  // Period that splits but is not truncated
  fails(schema, {
    dates: { begin: "20231022", end: "20231023" },
    days: 2,
    nominal: moneyZero(),
    actual: moneyZero(),
    truncate: TruncateMode.Split
  });
});

/* ================================================================================================================= *
 * Category Schemas                                                                                                  *
 * ================================================================================================================= */

const schema = categorySchema();

const valid: Category = {
  id: "10320132-3120321-321030213-1203021321",
  name: "Section snacks!",
  type: CategoryType.Spending,
  recurrence: {
    type: RecurrenceType.Weekly,
    amount: { amount: 2000, currency: defaultCurrency },
    day: 6
  },
  periods: [
    {
      dates: { begin: dateMin(), end: "20231009" },
      days: 0,
      nominal: moneyZero(),
      actual: moneyZero(),
      truncate: TruncateMode.Omit
    },
    {
      dates: { begin: "20231010", end: "20231014" },
      days: 7,
      nominal: moneyZero(),
      actual: moneyZero(),
      truncate: TruncateMode.Keep
    },
    {
      dates: { begin: "20231015", end: "20231021" },
      days: 7,
      nominal: moneyZero(),
      actual: moneyZero(),
      truncate: TruncateMode.Keep
    },
    {
      dates: { begin: "20231022", end: dateMax() },
      days: 0,
      nominal: moneyZero(),
      actual: moneyZero(),
      truncate: TruncateMode.Omit
    },
  ],
  rollover: {
    loss: RolloverMode.Next,
    surplus: RolloverMode.Average
  }
};

test("good-category", () => {
  passes(schema, valid);
});

test("bad-category-fewer-periods", () => {
  /* Validate on category with only two periods */
  fails(schema, produce(valid, (draft) => {
    draft.periods.splice(1, 2);
  }));
});

test("bad-category-order", () => {
  /* Validate on category with periods in non-chronological order */
  fails(schema, produce(valid, (draft) => {
    // Swap second and third periods
    [draft.periods[1], draft.periods[2]] = [draft.periods[2], draft.periods[1]];
  }));
});

test("bad-category-exhaustive", () => {
  /* Validate on category with periods that aren't back to back */
  fails(schema, produce(valid, (draft) => {
    draft.periods[2].dates.begin = "20231017";
  }));
});

test("bad-category-days", () => {
  /* Validate on category with days set to wrong value */
  fails(schema, produce(valid, (draft) => {
    draft.periods[1].days = 18;
  }));
});

test("bad-category-special-periods", () => {
  /* Validate on categories with bad special periods */
  fails(schema, produce(valid, (draft) => {
    draft.periods[0].truncate = TruncateMode.Keep;
  }));

  fails(schema, produce(valid, (draft) => {
    draft.periods[draft.periods.length - 1].truncate = TruncateMode.Keep;
  }));

  fails(schema, produce(valid, (draft) => {
    draft.periods[0].days = 5;
  }));
});