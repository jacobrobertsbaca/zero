import { Budget } from "src/types/budget/types";
import { supabase } from "./supabase";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { HttpError } from "./errors";

export const query = async <TResult>(
  query: PostgrestFilterBuilder<any, any, TResult, any>
): Promise<TResult> => {
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
  let budgetQuery = supabase.from("budgets").select().eq("owner", owner);
  if (id) budgetQuery = budgetQuery.eq("id", id);
  let categoryQuery = supabase.from("categories").select().eq("owner", owner);
  if (id) categoryQuery = categoryQuery.eq("budget", id);
  let periodQuery = supabase.from("periods").select().eq("owner", owner);
  if (id) periodQuery = periodQuery.eq("budget", id);

  const [ budgetRows, categoryRows, periodRows ] = await Promise.all([ query(budgetQuery), query(categoryQuery), query(periodQuery) ]);

  return [];
};