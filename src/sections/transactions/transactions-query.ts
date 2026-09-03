import type { SortingState } from "@tanstack/react-table";
import {
  decodeFilterModel,
  encodeFilterModel,
  filterModelToFilters,
  type SearchParamsLike,
  type TransactionFilterModel,
} from "src/sections/transactions/transaction-filter-model";
import type { Budget } from "src/types/budget/types";
import { TransactionSearchColumnSchema } from "src/types/transaction/schema";
import type { TransactionQuery } from "src/types/transaction/types";

export type TransactionsUrlQuery = {
  search?: string;
  sorting: SortingState;
  filter: TransactionFilterModel;
};

export type NextSearchParams = Record<string, string | string[] | undefined>;

export const toTransactionQuery = (query: TransactionsUrlQuery): TransactionQuery => ({
  search: query.search,
  sort: query.sorting.map((sort) => ({ column: sort.id as any, ascending: !sort.desc })),
  filter: filterModelToFilters(query.filter),
});

export const encodeTransactionsQuery = (query: TransactionsUrlQuery, params: URLSearchParams): void => {
  if (query.search) params.set("search", query.search);
  query.sorting.forEach((sort) => {
    params.append("sort", `${sort.desc ? "-" : ""}${sort.id}`);
  });
  encodeFilterModel(query.filter, params);
};

const asSearchParamsLike = (params: SearchParamsLike | NextSearchParams): SearchParamsLike => {
  if (
    typeof (params as SearchParamsLike).get === "function" &&
    typeof (params as SearchParamsLike).getAll === "function"
  )
    return params as SearchParamsLike;

  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => next.append(key, v));
    else next.append(key, value);
  }
  return next;
};

export const decodeTransactionsQuery = (
  params: SearchParamsLike | NextSearchParams,
  budgets: readonly Budget[] | undefined
): TransactionsUrlQuery => {
  params = asSearchParamsLike(params);
  const search = params.get("search") ?? undefined;
  const sorting = params
    .getAll("sort")
    .map((column) => {
      const desc = column.startsWith("-");
      if (desc) column = column.slice(1);
      const result = TransactionSearchColumnSchema.safeParse(column);
      if (!result.success) return undefined;
      return { id: column, desc };
    })
    .filter((sort): sort is { id: string; desc: boolean } => !!sort);
  const filter = decodeFilterModel(params, budgets);
  return { search, sorting, filter };
};
