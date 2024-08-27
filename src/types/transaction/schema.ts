import { z } from "zod";
import { MoneySchema } from "../money/schema";
import { DateStringSchema } from "../utils/schema";
import { TransactionFilter } from "./types";

export const TransactionSchema = z.object({
  id: z.string(),
  budget: z.string(),
  category: z.string(),
  date: DateStringSchema,
  amount: MoneySchema,
  name: z.string().trim().max(120),
  lastModified: z.string(),
  starred: z.boolean(),
  note: z.string().trim().max(1000),
});

const textColumns = z.enum(["id", "budget", "category", "date", "name", "lastModified", "note"]);
const boolColumns = z.enum(["starred"]);
const numberColumns = z.enum(["amount"]);

export const SearchColumnSchema = z.enum([
  ...textColumns.options,
  ...boolColumns.options,
  ...numberColumns.options,
] as const);

export const BaseTransactionFilterSchema = z
  .object({
    type: z.literal("column"),
    filter: z.enum(["gte", "lte", "eq", "gt", "lt"]),
  })
  .and(
    z.discriminatedUnion("column", [
      z.object({ column: textColumns, value: z.string() }),
      z.object({ column: boolColumns, value: z.boolean() }),
      z.object({ column: numberColumns, value: z.number() }),
    ])
  );

export const TransactionFilterSchema: z.ZodType<TransactionFilter> = z.union([
  BaseTransactionFilterSchema,
  z.object({
    type: z.enum(["or", "and"]),
    filters: z.lazy(() => TransactionFilterSchema.array()),
  }),
]);

export const TransactionSortSchema = z.object({
  column: SearchColumnSchema.exclude(["id"]),
  ascending: z.boolean(),
});

export const TransactionQuerySchema = z.object({
  /** Column sorts to apply. Earlier columns get sorted first */
  sort: TransactionSortSchema.array()
    .optional()
    .refine((a) => {
      if (!a) return true;
      const columns = a.map((s) => s.column);
      return new Set(columns).size === a.length;
    }, "sort cannot have duplicate columns"),
  /** How to filter fetched transactions */
  filter: TransactionFilterSchema.optional(),
  /** Optional string to full-text searching on transactions */
  search: z.string().optional(),
});
