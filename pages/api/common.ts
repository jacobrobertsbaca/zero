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
import type { Transaction, TransactionFilter, TransactionSort } from "src/types/transaction/types";
import { transactionCompare } from "src/types/transaction/methods";
import { assert } from "console";

/* ================================================================================================================= *
 * Utility Functions                                                                                                 *
 * ================================================================================================================= */

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

/* ================================================================================================================= *
 * Database Helpers                                                                                                  *
 * ================================================================================================================= */

const CATEGORY_QUERY = `
  id, name, type, rec_type, rec_day, rec_amount, ro_loss, ro_surplus,
  periods (
    begin_date, end_date, days, nominal, actual, truncate
  )
` as const;

const BUDGET_QUERY = `
  id, name, begin_date, end_date,
  categories (${CATEGORY_QUERY})
` as const;

const TRANSACTION_QUERY = `
  id, category, budget, date, amount, name, last_modified, starred, note
` as const;

const retrieveBudgets = async (owner: string, id?: string) => {
  let query = supabase.from("budgets").select(BUDGET_QUERY).eq("owner", owner);
  if (id) query = query.eq("id", id);
  return await wrap(query);
};

const retrieveCategory = async (owner: string, id: string) => {
  const query = supabase.from("categories").select(CATEGORY_QUERY).eq("owner", owner).eq("id", id);
  return await wrap(query);
};

const retrieveTransactions = async (owner: string) => {
  const query = supabase.from("transactions").select(TRANSACTION_QUERY).eq("owner", owner);
  return await wrap(query);
};

type ReadBudgetRow = Awaited<ReturnType<typeof retrieveBudgets>>[0];
type ReadCategoryRow = ReadBudgetRow["categories"][0];
type ReadPeriodRow = ReadCategoryRow["periods"][0];
type ReadTransactionRow = Awaited<ReturnType<typeof retrieveTransactions>>[0];
type WriteBudgetRow = Omit<ReadBudgetRow, "categories"> & { owner: any };
type WriteCategoryRow = Omit<ReadCategoryRow, "periods"> & { owner: any; budget: any };
type WritePeriodRow = ReadPeriodRow & { owner: any; budget: any; category: any };
type WriteTransactionRow = ReadTransactionRow & { owner: any };

const parsePeriod = (row: ReadPeriodRow): Period => ({
  dates: {
    begin: row.begin_date,
    end: row.end_date,
  },
  days: row.days,
  nominal: { amount: row.nominal, currency: defaultCurrency },
  actual: { amount: row.actual, currency: defaultCurrency },
  truncate: row.truncate,
});

const parseRecurrence = (row: ReadCategoryRow): Recurrence => {
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

const parseCategory = (row: ReadCategoryRow): Category => ({
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

const parseBudget = (row: ReadBudgetRow): Budget => ({
  id: row.id,
  name: row.name,
  dates: {
    begin: row.begin_date,
    end: row.end_date,
  },
  categories: row.categories.map((r) => parseCategory(r)),
});

const parseTransaction = (row: ReadTransactionRow): Transaction => ({
  id: row.id,
  budget: row.budget,
  category: row.category,
  date: row.date,
  amount: { amount: row.amount, currency: defaultCurrency },
  name: row.name,
  lastModified: row.last_modified,
  starred: row.starred,
  note: row.note,
});

const formatPeriod = (owner: string, budget: string, category: string, period: Period): WritePeriodRow => ({
  owner,
  category: category,
  budget: budget,
  begin_date: period.dates.begin,
  end_date: period.dates.end,
  days: period.days,
  nominal: period.nominal.amount,
  actual: period.actual.amount,
  truncate: period.truncate,
});

const formatCategory = (owner: string, budget: string, category: Category): WriteCategoryRow => ({
  owner,
  id: category.id,
  budget: budget,
  name: category.name,
  type: category.type,
  rec_type: category.recurrence.type,
  rec_day: (category.recurrence as any).day,
  rec_amount: category.recurrence.amount.amount,
  ro_loss: category.rollover.loss,
  ro_surplus: category.rollover.surplus,
});

const formatBudget = (owner: string, budget: Budget): WriteBudgetRow => ({
  owner,
  id: budget.id,
  name: budget.name,
  begin_date: budget.dates.begin,
  end_date: budget.dates.end,
});

const formatTransaction = (owner: string, trx: Transaction): WriteTransactionRow => ({
  owner,
  id: trx.id,
  category: trx.category,
  budget: trx.budget,
  date: trx.date,
  amount: trx.amount.amount,
  name: trx.name,
  last_modified: trx.lastModified,
  starred: trx.starred,
  note: trx.note,
});

/* ================================================================================================================= *
 * API Endpoints                                                                                                     *
 * ================================================================================================================= */

/**
 * Retrieves a collection of budgets from the database.
 * @param owner The id of the requesting user.
 * @param id The id of the bduget to request. If undefined, retrieves all the user's budgets.
 */
export const getBudgets = async (owner: string, id?: string): Promise<Budget[]> => {
  const rows = await retrieveBudgets(owner, id);
  return rows.map(parseBudget).sort(budgetCompare);
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
      categories: existing?.categories ?? [],
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

  const budgetRow = formatBudget(owner, newBudget);
  const categoryRows = newBudget.categories.map((c) => formatCategory(owner, newBudget.id, c));
  const periodRows = newBudget.categories.flatMap((c) =>
    c.periods.map((p) => formatPeriod(owner, newBudget.id, c.id, p))
  );

  await wrap(
    supabase.rpc("put_budget", {
      budget_json: budgetRow,
      categories_json: categoryRows,
      periods_json: periodRows,
    })
  );

  /* Re-fetch the budget and return to retrieve updated actual amounts for each period */
  const budgets = await getBudgets(owner, newBudget.id);
  if (budgets.length === 0) throw new NotFound("Budget was deleted during modification!");
  return budgets[0];
};

/**
 * Upserts a category belonged to a budget with id `bid` owned by user id `owner` into the database.
 * @param owner The owner of the category.
 * @param bid The id of the containing budget.
 * @param category The category to upsert.
 */
export const putCategory = async (owner: string, bid: string, category: Category): Promise<Category> => {
  /* Verify that a budget with this id exists and is owned by owner */
  const budget = await wrap(supabase.from("budgets").select("id").eq("owner", owner).eq("id", bid));
  if (budget.length === 0) throw new NotFound("No such budget exists!");

  /* If modifying an existing category, verify that category exists in this budget and is owned by this user.
   * Otherwise give the category a fresh id */
  if (category.id) {
    const existing = await wrap(
      supabase.from("categories").select("id").eq("owner", owner).eq("budget", bid).eq("id", category.id)
    );
    if (existing.length === 0) throw new NotFound("No such category exists!");
  } else {
    category = produce(category, (draft) => {
      draft.id = crypto.randomUUID();
    });
  }

  /* Upload new category to database */
  const categoryRow = formatCategory(owner, bid, category);
  const periodRows = category.periods.map((p) => formatPeriod(owner, bid, category.id, p));

  await wrap(
    supabase.rpc("put_category", {
      category_json: categoryRow,
      periods_json: periodRows,
    })
  );

  /* Finally, fetch uploaded category from database to get computed values */
  const rows = await retrieveCategory(owner, category.id);
  if (rows.length === 0) throw new NotFound("Category was deleted during modification!");
  return parseCategory(rows[0]);
};

/**
 * Deletes a budget.
 * @param owner The id of the user owning the budget.
 * @param bid The id of the budget to delete.
 */
export const deleteBudget = async (owner: string, bid: string): Promise<void> => {
  await wrap(supabase.from("budgets").delete().eq("id", bid).eq("owner", owner));
};

/**
 * Deletes a category.
 * @param owner The id of the user owning the category.
 * @param bid The id of the budget containing the category.
 * @param cid The id of the category to delete.
 */
export const deleteCategory = async (owner: string, bid: string, cid: string): Promise<void> => {
  await wrap(supabase.from("categories").delete().eq("id", cid).eq("budget", bid).eq("owner", owner));
};

export const getTransactions = async (owner: string): Promise<Transaction[]> => {
  const rows = await retrieveTransactions(owner);
  return rows.map(parseTransaction).sort(transactionCompare);
};

export const putTransaction = async (owner: string, trx: Transaction): Promise<Transaction> => {
  /* Verify that budget and category exist and are owned by this user */
  const budget = await wrap(supabase.from("budgets").select("id").eq("owner", owner).eq("id", trx.budget));
  if (budget.length === 0) throw new NotFound("Budget associated with transaction doesn't exist!");

  const category = await wrap(
    supabase.from("categories").select("id").eq("owner", owner).eq("budget", trx.budget).eq("id", trx.category)
  );
  if (category.length === 0) throw new NotFound("Category associated with transaction doesn't exist!");

  /* If modifying an existing transaction, verify that transaction exists and is owned by this user.
   * Otherwise give the transaction a fresh id */
  if (trx.id) {
    const existing = await wrap(supabase.from("transactions").select("id").eq("owner", owner));
    if (existing.length === 0) throw new NotFound("No such transaction exists!");
  } else {
    trx = produce(trx, (draft) => {
      draft.id = crypto.randomUUID();
    });
  }

  /* Set last modified time */
  trx = produce(trx, (draft) => {
    draft.lastModified = new Date().toISOString();
  });

  /* Write transaction to the database using `put_transaction` rpc */
  await wrap(
    supabase.rpc("put_transaction", {
      transaction_json: formatTransaction(owner, trx),
    })
  );

  return trx;
};

export const deleteTransaction = async (owner: string, tid: string): Promise<void> => {
  await wrap(
    supabase.rpc("delete_transaction", {
      transaction_id: tid,
      owner_id: owner,
    })
  );
};

/* ================================================================================================================= *
 * Transaction Search                                                                                                *
 * ================================================================================================================= */

/**
 * Converts a transaction object key to its associated database column.
 * @param column The transaction column name
 */
const getTrxDbColumn = (column: keyof Transaction): string => {
  if (column === "lastModified") return "last_modified";
  return column;
};

const resolvePostgrestFilter = (filter: TransactionFilter): string => {
  if (filter.type === "column") {
    return `${getTrxDbColumn(filter.column)}.${filter.filter}.${JSON.stringify(filter.value)}`;
  }

  if (filter.type === "and" || filter.type === "or") {
    return `${filter.type}(${filter.filters.map(resolvePostgrestFilter).join(",")})`;
  }

  // If we add new filter types, the following lines should verify that
  // we checked all possible values for `filter.type` and if not, throw a
  // compile time error for TypeScript
  type assert<T extends true> = never;
  type check = assert<typeof filter.type extends never ? true : false>;
  throw new Error(`No such filter type: ${filter.type}`);
};

/**
 * Converts the transaction cursor into a series of filters that restrict the
 * results to those occuring after the cursor.
 * @param sort   How results should be ordered
 * @param cursor A transaction cursor
 */
const getTrxCursorFilter = (sort: TransactionSort[], cursor: Transaction): TransactionFilter => {
  const filters: TransactionFilter[] = [];

  function filterFor(equal: boolean, order?: TransactionSort): TransactionFilter {
    const column = order?.column || "id";
    let value;
    if (column === "amount") value = cursor.amount!.amount;
    else value = cursor[column]!;

    return {
      type: "column",
      column,
      filter: equal ? "eq" : order ? (order.ascending ? "gt" : "lt") : "gt",
      value,
    };
  }

  // Construct comparison (t0, t1, ..., tn) > (c0, c1, ..., cn)
  // with the caveat that individual terms can be either ascending or descending.
  // tn and cn are always sorting the transactions by id in ascending order
  for (let i = 0; i <= sort.length; i++) {
    if (i === 0) {
      filters.push(filterFor(false, sort[i]));
      continue;
    }

    const andFilters: TransactionFilter[] = [];
    for (let j = 0; j < i; j++) {
      andFilters.push(filterFor(true, sort[j]));
    }
    andFilters.push(filterFor(false, sort[i]));
    filters.push({ type: "and", filters: andFilters });
  }

  if (filters.length === 1) return filters[0];
  return { type: "or", filters };
};

export const searchTransactions = async (
  owner: string,
  filter: TransactionFilter | undefined,
  sort: TransactionSort[] | undefined,
  cursor: Transaction | undefined,
  limit: number
): Promise<Transaction[]> => {
  const query = supabase.from("transactions").select(TRANSACTION_QUERY).eq("owner", owner);

  /* Sort query. If sorting unspecified, apply default sorting */
  if (!sort)
    sort = [
      { column: "starred", ascending: false },
      { column: "date", ascending: false },
    ];

  for (const column of sort) {
    query.order(column.column, { ascending: column.ascending });
  }

  query.order("id");

  /* Apply filters to query, including those for the cursor */
  if (cursor) {
    const cursorFilter = getTrxCursorFilter(sort, cursor);
    if (filter) filter = { type: "and", filters: [filter, cursorFilter ] };
    else filter = cursorFilter;
  }

  if (filter) query.or(resolvePostgrestFilter(filter));

  /* Limit query results */
  query.limit(limit);

  /* Execute query */
  const rows = await wrap(query);
  return rows.map(parseTransaction)
};
