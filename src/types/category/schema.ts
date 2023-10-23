import { z } from "zod";
import { CategoryType, RecurrenceType, RolloverMode, TruncateMode } from "./types";
import { MoneySchema } from "../money/schema";
import { DatesSchema } from "../utils/schema";

const RecurrenceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal(RecurrenceType.None), amount: MoneySchema }),
  z.object({ type: z.literal(RecurrenceType.Weekly), amount: MoneySchema, day: z.number().min(0).max(6) }),
  z.object({ type: z.literal(RecurrenceType.Monthly), amount: MoneySchema, day: z.number().min(1).max(31) }),
]);

const PeriodSchema = z.object({
  dates: DatesSchema,
  days: z.number().min(0),
  nominal: MoneySchema,
  actual: MoneySchema,
  truncate: z.nativeEnum(TruncateMode)
});

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.nativeEnum(CategoryType),
  recurrence: RecurrenceSchema,
  periods: PeriodSchema.array().min(3),
  rollover: z.object({
    loss: z.nativeEnum(RolloverMode),
    surplus: z.nativeEnum(RolloverMode)
  })
});
