import { z } from "zod";
import { DatesSchema } from "../utils/schema";
import { CategorySchema } from "../category/schema";

export const BudgetSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  dates: DatesSchema,
  categories: CategorySchema.array(),
});
