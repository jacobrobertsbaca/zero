import { Budget } from "src/types/budget/types";
import { supabase } from "./supabase";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { HttpError } from "./errors";
import { Category, Period, Recurrence, RecurrenceType } from "src/types/category/types";
import { defaultCurrency } from "src/types/money/methods";
import { budgetCompare } from "src/types/budget/methods";

/**
 * Wraps a Supabase database query so that it throw {@link HttpError} on failure.
 * @param query The query to wrap
 * @returns A promise that, when awaited, returns the query's data.
 */
export const wrap = async <TResult>(query: PostgrestFilterBuilder<any, any, TResult, any>): Promise<TResult> => {
  const { data, error } = await query;
  if (error) throw new HttpError(error.code, error.message);
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
  query = query.order("begin_date", { foreignTable: "periods", ascending: true });
  const result = await wrap(query);

  type BudgetRow = typeof result[0];
  type CategoryRow = BudgetRow["categories"][0];
  type PeriodRow = CategoryRow["periods"][0];

  const parsePeriod = (row: PeriodRow): Period => ({
    dates: {
      begin: row.begin_date,
      end: row.begin_date
    },
    days: row.days,
    nominal: { amount: row.nominal, currency: defaultCurrency },
    actual: { amount: row.actual, currency: defaultCurrency },
    truncate: row.truncate
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
    periods: row.periods.map(r => parsePeriod(r)),
    rollover: {
      loss: row.ro_loss,
      surplus: row.ro_surplus
    }
  });

  const parseBudget = (row: BudgetRow): Budget => ({
    id: row.id,
    name: row.name,
    dates: {
      begin: row.begin_date,
      end: row.end_date
    },
    categories: row.categories.map(r => parseCategory(r))
  });

  return result.map(r => parseBudget(r)).sort(budgetCompare);
};
