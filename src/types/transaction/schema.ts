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

export const BaseTransactionFilterSchema = z.object({
  type: z.literal("column"),
  column: TransactionSchema.keyof(),
  filter: z.enum(["gte", "lte", "eq", "gt", "lt"]),
  value: z.union([z.boolean(), z.string(), z.number()]),
});

export const TransactionFilterSchema: z.ZodType<TransactionFilter> = z.union([
  BaseTransactionFilterSchema,
  z.object({
    type: z.enum(["or", "and"]),
    filters: z.lazy(() => TransactionFilterSchema.array()),
  }),
]);

export const TransactionSortSchema = z.object({
  column: TransactionSchema.keyof().exclude(["id"]),
  ascending: z.boolean(),
});
