import { Budget } from "src/types/budget/types";
import { supabase } from "./supabase";
import { PostgrestFilterBuilder, PostgrestTransformBuilder } from "@supabase/postgrest-js";
import { HttpError, NotFound } from "./errors";
import { Category, Period, Recurrence, RecurrenceType } from "src/types/category/types";
import { defaultCurrency } from "src/types/money/methods";
import { budgetCompare } from "src/types/budget/methods";
import { categoryNominal, onCategoryNominal, onRecurrence, periodCompare } from "src/types/category/methods";
import { isEqual } from "lodash";
import { Draft, produce } from "immer";

/**
 * Wraps a Supabase database query so that it throw {@link HttpError} on failure.
 * @param query The query to wrap
 * @returns A promise that, when awaited, returns the query's data.
 */
export const wrap = async <TResult>(
  query: PostgrestFilterBuilder<any, any, TResult, any> | PostgrestTransformBuilder<any, any, TResult, any>
): Promise<TResult> => {
  const { data, error } = await query;
  if (error) {
    console.log(error);
    throw new HttpError(error.code, error.message);
  }
  return data;
};

/**
 * Retrieves a collection of budgets from the database.
 * @param owner The id of the requesting user.
 * @param id The id of the bduget to request. If undefined, retrieves all the user's budgets.
 */
export const getBudgets = async (owner: string, id?: string): Promise<Budget[]> => {
  let query = supabase
    .from("budgets")
    .select(
      `
      id, name, begin_date, end_date,
      categories (
        id, name, type, rec_type, rec_day, rec_amount, ro_loss, ro_surplus,
        periods (
          begin_date, end_date, days, nominal, actual, truncate
        )
      )
    `
    )
    .eq("owner", owner);
  if (id) query = query.eq("id", id);
  const result = await wrap(query);

  type BudgetRow = (typeof result)[0];
  type CategoryRow = BudgetRow["categories"][0];
  type PeriodRow = CategoryRow["periods"][0];

  const parsePeriod = (row: PeriodRow): Period => ({
    dates: {
      begin: row.begin_date,
      end: row.end_date,
    },
    days: row.days,
    nominal: { amount: row.nominal, currency: defaultCurrency },
    actual: { amount: row.actual, currency: defaultCurrency },
    truncate: row.truncate,
  });

  const parseRecurrence = (row: CategoryRow): Recurrence => {
    const amount = { amount: row.rec_amount, currency: defaultCurrency };
    switch (row.rec_type) {
      case RecurrenceType.None:
        return { type: row.rec_type, amount };
      case RecurrenceType.Monthly:
        return { type: row.rec_type, day: row.rec_day, amount };
      case RecurrenceType.Weekly:
        return { type: row.rec_type, day: row.rec_day, amount };
    }
    throw new HttpError(500, `No such recurrence type: ${row.rec_type}`);
  };

  const parseCategory = (row: CategoryRow): Category => ({
    id: row.id,
    name: row.name,
    type: row.type,
    recurrence: parseRecurrence(row),
    periods: row.periods.map((r) => parsePeriod(r)).sort(periodCompare),
    rollover: {
      loss: row.ro_loss,
      surplus: row.ro_surplus,
    },
  });

  const parseBudget = (row: BudgetRow): Budget => ({
    id: row.id,
    name: row.name,
    dates: {
      begin: row.begin_date,
      end: row.end_date,
    },
    categories: row.categories.map((r) => parseCategory(r)),
  });

  return result.map((r) => parseBudget(r)).sort(budgetCompare);
};

/**
 * Upserts a budget owned by {@link owner} into the database. Returns the budget as it exists on the database after modification.
 * @param owner The owner of the existing or created budget.
 * @param budget A budget. If `id` is empty, a new budget will be created.
 */
export const putBudget = async (owner: string, budget: Omit<Budget, "categories">): Promise<Budget> => {
  /* Get existing budget dates from database and ensure this user owns it. */
  let existing: Budget | undefined = undefined;
  if (budget.id) {
    const budgets = await getBudgets(owner, budget.id);
    if (budgets.length === 0) throw new NotFound("No such budget exists!");
    existing = budgets[0];
  }

  /* If budget is new or budget dates haven't changed, all we need to do is upsert the budget row
   * since no modifications of the other tables will be required.
   */
  if (!existing || isEqual(existing.dates, budget.dates)) {
    const result = (
      await wrap(
        supabase
          .from("budgets")
          .upsert({
            id: budget.id || crypto.randomUUID(),
            owner,
            name: budget.name,
            begin_date: budget.dates.begin,
            end_date: budget.dates.end,
          })
          .select("id, name, begin_date, end_date")
      )
    )[0];

    return {
      id: result.id,
      name: result.name,
      dates: { begin: result.begin_date, end: result.end_date },
      categories: [],
    };
  }

  /* Budget exists and its dates have changed, so we need to modify the `budgets`, `categories`, and `periods` tables.
   * We can accomplish this by computing what the new budget, categories, and periods should look like, and then call
   * the `put_budget` SQL function to atomically modify the tables.
   * 
   * `put_budget` will automatically adjust the values of `period.actual` to match existing transactions for each
   * category, so we will need to refetch the budget after calling `put_budget`.
   */

  const newBudget = produce(existing, (draft) => {
    draft.name = budget.name;
    draft.dates = budget.dates;

    for (let i = 0; i < draft.categories.length; i++) {
      /* Preserve total category amount */
      const total = categoryNominal(draft.categories[i]);

      /* Reset category periods so that they get updated by onRecurrence */
      draft.categories[i].periods = [];
      draft.categories[i] = onRecurrence(draft, draft.categories[i], draft.categories[i].recurrence) as Draft<Category>;
      draft.categories[i] = onCategoryNominal(draft.categories[i], total) as Draft<Category>;
    }
  });

  const budgetRow = {
    id: newBudget.id,
    owner,
    name: newBudget.name,
    begin_date: newBudget.dates.begin,
    end_date: newBudget.dates.end
  };

  const categoryRows = newBudget.categories.map(c => ({
    id: c.id,
    owner,
    budget: newBudget.id,
    name: c.name,
    type: c.type,
    rec_type: c.recurrence.type,
    rec_day: (c.recurrence as any).day,
    rec_amount: c.recurrence.amount.amount,
    ro_loss: c.rollover.loss,
    ro_surplus: c.rollover.surplus
  }));

  const periodRows = newBudget.categories.flatMap(c => c.periods.map(p => ({
    owner,
    category: c.id,
    budget: newBudget.id,
    begin_date: p.dates.begin,
    end_date: p.dates.end,
    days: p.days,
    nominal: p.nominal.amount,
    actual: p.actual.amount,
    truncate: p.truncate
  })));

  await wrap(
    supabase.rpc("put_budget", {
      budget_json: budgetRow,
      categories_json: categoryRows,
      periods_json: periodRows,
    })
  );

  /* Re-fetch the budget and return to retrieve updated actual amounts for each period */
  const budgets = await getBudgets(owner, newBudget.id);
  if (budgets.length === 0) throw new NotFound("Budget was deleted!");
  return budgets[0];
};
