import { z } from "zod";
import { MoneySchema } from "../money/schema";
import { DateStringSchema } from "../utils/schema";
import { TransactionFilter } from "./types";

export const SyncDetailsSchema = z.object({
  name: z.string(),
  original_name: z.string(),
  account_id: z.string(),
  status: z.enum(["posted", "pending", "removed"]),
  amount: MoneySchema,
  datetime: z.string().optional(),
  merchant: z
    .object({
      name: z.string(),
      logo_url: z.string().optional(),
    })
    .optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      address: z.string().optional(),
      city: z.string().optional(),
      region: z.string().optional(),
      country: z.string().optional(),
      postal_code: z.string().optional(),
    })
    .optional(),
  payment_channel: z.enum(["online", "physical", "other"]),
  overrides: z.object({
    name: z.literal(true).optional(),
    amount: z.literal(true).optional(),
  }),
});

export const TransactionSyncSchema = z.object({
  id: z.string(),
  pending: z.boolean(),
  details: SyncDetailsSchema,
});

export const TransactionSchema = z.object({
  id: z.string(),
  budget: z.string().nullable(),
  category: z.string().nullable(),
  date: DateStringSchema,
  amount: MoneySchema,
  name: z.string().trim().max(120),
  lastModified: z.string(),
  starred: z.boolean(),
  note: z.string().trim().max(1000),
  sync: TransactionSyncSchema.optional(),
});

export const TransactionCursorSchema = TransactionSchema.extend({
  budgetName: z.string().nullable(),
  categoryName: z.string().nullable(),
});

const textColumns = z.enum([
  "id",
  "budget",
  "category",
  "date",
  "name",
  "lastModified",
  "note",
  "categoryName",
  "budgetName",
]);
const boolColumns = z.enum(["starred", "syncPending"]);
const numberColumns = z.enum(["amount"]);

export const TransactionSearchColumnSchema = z.enum([
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
  column: TransactionSearchColumnSchema.exclude(["id"]),
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
