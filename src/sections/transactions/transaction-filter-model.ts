import { DateString } from "src/types/utils/types";
import { Money } from "src/types/money/types";
import { Budget } from "src/types/budget/types";
import { moneyFormat, MoneyFormatOptions, moneyParse } from "src/types/money/methods";
import { DateStringSchema } from "src/types/utils/schema";
import { TransactionFilter } from "src/types/transaction/types";

export type TransactionFilterModel = {
  dateMin: DateString | null /* start in URL */;
  dateMax: DateString | null /* end in URL */;
  amountMin: Money | null /* min in URL */;
  amountMax: Money | null /* max in URL */;

  /** An array of budget IDs to filter by. This is disjunctive, and disjunctive with category. */
  budget: string[] /* budget in URL */;

  /** An array of category IDs to filter by. This is disjunctive, and disjunctive with budget. */
  category: string[] /* category in URL */;
};

/** Minimal search-params interface used by encode/decode (works on server and client). */
export type SearchParamsLike = {
  get(name: string): string | null;
  getAll(name: string): string[];
};

export const emptyFilters = (): TransactionFilterModel => ({
  dateMin: null,
  dateMax: null,
  amountMin: null,
  amountMax: null,
  budget: [],
  category: [],
});

export const filterModelToFilters = (model: TransactionFilterModel): TransactionFilter | undefined => {
  const filters: TransactionFilter[] = [];

  if (model.dateMin) filters.push({ type: "column", column: "date", filter: "gte", value: model.dateMin });
  if (model.dateMax) filters.push({ type: "column", column: "date", filter: "lte", value: model.dateMax });
  if (model.amountMin) filters.push({ type: "column", column: "amount", filter: "gte", value: model.amountMin.amount });
  if (model.amountMax) filters.push({ type: "column", column: "amount", filter: "lte", value: model.amountMax.amount });

  if (model.budget.length > 0 || model.category.length > 0) {
    const subFilters: TransactionFilter[] = [];
    model.budget.forEach((id) => subFilters.push({ type: "column", column: "budget", filter: "eq", value: id }));
    model.category.forEach((id) => subFilters.push({ type: "column", column: "category", filter: "eq", value: id }));
    filters.push({ type: "or", filters: subFilters });
  }

  if (filters.length === 0) return undefined;
  return { type: "and", filters };
};

export const encodeFilterModel = (filter: TransactionFilterModel, params: URLSearchParams): void => {
  if (!filter) return;

  const format: MoneyFormatOptions = { excludeSymbol: true };
  if (filter.dateMin) params.set("start", filter.dateMin);
  if (filter.dateMax) params.set("end", filter.dateMax);
  if (filter.amountMin) params.set("min", moneyFormat(filter.amountMin, format));
  if (filter.amountMax) params.set("max", moneyFormat(filter.amountMax, format));
  filter.budget.forEach((id) => params.append("budget", id));
  filter.category.forEach((id) => params.append("category", id));
};

const parseParam = <T,>(param: string | null, parser: (value: string) => T): T | null => {
  if (param === null) return null;
  try {
    return parser(param);
  } catch (err) {
    console.warn("Failed to parse filter parameter. Got error: ", err);
  }

  return null;
};

/**
 * Decodes a filter model from the URL search params.
 * @param params    Params to decode.
 * @param budgets   Budgets to use for decoding.
 *                  Needed in order to strip non-existent IDs.
 * @returns         The decoded filter model.
 */
export const decodeFilterModel = (
  params: SearchParamsLike,
  budgets: readonly Budget[] | undefined
): TransactionFilterModel => {
  const dateMin = parseParam(params.get("start"), DateStringSchema.parse);
  const dateMax = parseParam(params.get("end"), DateStringSchema.parse);
  const amountMin = parseParam(params.get("min"), moneyParse);
  const amountMax = parseParam(params.get("max"), moneyParse);

  let budget = params.getAll("budget");
  let category = params.getAll("category");

  /* If budgets are available, strip out any non-existent IDs. */
  if (budgets) {
    const allBudgets = new Set(budgets.map((b) => b.id));
    const allCategories = new Set(budgets.flatMap((b) => b.categories.map((c) => c.id)));
    budget = budget.filter((id) => allBudgets.has(id));
    category = category.filter((id) => allCategories.has(id));
  }

  return { dateMin, dateMax, amountMin, amountMax, budget, category };
};
