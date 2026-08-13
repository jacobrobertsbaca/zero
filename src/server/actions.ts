"use server";

import { z } from "zod";
import { deleteBudget as deleteBudgetRecord, putBudget as putBudgetRecord } from "src/server/common";
import { budgetMaxDays, budgetMaxYears } from "src/types/budget/methods";
import { BudgetSchema } from "src/types/budget/schema";
import type { Budget } from "src/types/budget/types";
import { datesDays } from "src/types/utils/methods";
import { userId } from "src/utils/supabase/server";

const PutBudgetSchema = BudgetSchema.omit({ categories: true }).refine(
  (value) => datesDays(value.dates) <= budgetMaxDays(),
  `Budget duration cannot exceed ${budgetMaxYears()} years`
);

export async function putBudget(budget: Omit<Budget, "categories">): Promise<Budget> {
  const parsed = PutBudgetSchema.parse(budget);
  const owner = await userId();
  return putBudgetRecord(owner, parsed);
}

export async function deleteBudget(budget: Budget): Promise<void> {
  const id = z.string().min(1).parse(budget.id);
  const owner = await userId();
  await deleteBudgetRecord(owner, id);
}
