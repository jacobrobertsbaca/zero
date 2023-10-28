import { z } from "zod";
import { MoneySchema } from "../money/schema";
import { DateStringSchema } from "../utils/schema";

export const TransactionSchema = z.object({
  id: z.string(),
  budget: z.string(),
  category: z.string(),
  date: DateStringSchema,
  amount: MoneySchema,
  name: z.string()
});