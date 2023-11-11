import { z } from "zod";
import { DatesSchema } from "../utils/schema";
import { CategorySchema } from "../category/schema";
import { datesDays } from "../utils/methods";
import { budgetMaxDays, budgetMaxYears } from "./methods";

export const BudgetSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(60),
  dates: DatesSchema,
  categories: CategorySchema.array(),
});
