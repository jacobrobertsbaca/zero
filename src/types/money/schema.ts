import { z } from "zod";
import { defaultCurrency } from "./methods";

export const MoneySchema = z.object({
  amount: z.number(),
  currency: z.literal(defaultCurrency),
});
