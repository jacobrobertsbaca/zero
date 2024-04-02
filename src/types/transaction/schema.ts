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

export const TransactionCursorSchema = TransactionSchema.partial().merge(TransactionSchema.pick({ id: true }));

export const BaseTransactionFilterSchema = z
  .object({ column: TransactionSchema.keyof() })
  .and(
    z.union([
      z
        .object({ type: z.literal("text") })
        .and(
          z.discriminatedUnion("filter", [
            z.object({ filter: z.literal("gte"), value: z.string() }),
            z.object({ filter: z.literal("lte"), value: z.string() }),
          ])
        ),
      z
        .object({ type: z.literal("number") })
        .and(
          z.discriminatedUnion("filter", [
            z.object({ filter: z.literal("gte"), value: z.number() }),
            z.object({ filter: z.literal("lte"), value: z.number() }),
          ])
        ),
    ])
  );

export const TransactionFilterSchema: z.ZodType<TransactionFilter> = z.union([
  BaseTransactionFilterSchema,
  z.object({
    type: z.enum(["or", "and"]),
    filters: z.lazy(() => TransactionFilterSchema.array()),
  }),
]);
