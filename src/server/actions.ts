"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  deleteBudget as deleteBudgetRecord,
  deleteCategory as deleteCategoryRecord,
  putBudget as putBudgetRecord,
  putCategory as putCategoryRecord,
} from "src/server/common";
import { budgetMaxDays, budgetMaxYears } from "src/types/budget/methods";
import { BudgetSchema } from "src/types/budget/schema";
import type { Budget } from "src/types/budget/types";
import { CategorySchema } from "src/types/category/schema";
import type { Category } from "src/types/category/types";
import { datesDays } from "src/types/utils/methods";
import { userId } from "src/utils/supabase/server";

const PutBudgetSchema = BudgetSchema.omit({ categories: true }).refine(
  (value) => datesDays(value.dates) <= budgetMaxDays(),
  `Budget duration cannot exceed ${budgetMaxYears()} years`
);

const revalidateBudget = (budgetId: string) => {
  revalidatePath("/budgets");
  revalidatePath(`/budgets/${budgetId}`);
};

export async function putBudget(budget: Omit<Budget, "categories">): Promise<Budget> {
  const parsed = PutBudgetSchema.parse(budget);
  const owner = await userId();
  const result = await putBudgetRecord(owner, parsed);
  revalidateBudget(result.id);
  return result;
}

export async function deleteBudget(budget: Budget): Promise<void> {
  const id = z.string().min(1).parse(budget.id);
  const owner = await userId();
  await deleteBudgetRecord(owner, id);
  revalidateBudget(id);
}

export async function putCategory(budgetId: string, category: Category): Promise<Category> {
  const bid = z.string().min(1).parse(budgetId);
  const parsed = CategorySchema.parse(category);
  const owner = await userId();
  const result = await putCategoryRecord(owner, bid, parsed);
  revalidateBudget(bid);
  return result;
}

export async function deleteCategory(budgetId: string, categoryId: string): Promise<void> {
  const bid = z.string().min(1).parse(budgetId);
  const cid = z.string().min(1).parse(categoryId);
  const owner = await userId();
  await deleteCategoryRecord(owner, bid, cid);
  revalidateBudget(bid);
}
