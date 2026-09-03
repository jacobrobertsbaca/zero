"use server";

import { revalidatePath, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { tags } from "src/server/tags";
import { z } from "zod";
import {
  deleteBudget as deleteBudgetRecord,
  deleteCategory as deleteCategoryRecord,
  deleteTransaction as deleteTransactionRecord,
  getBudgets as getBudgetsRecord,
  putBudget as putBudgetRecord,
  putCategory as putCategoryRecord,
  putTransaction as putTransactionRecord,
  reorderCategories as reorderCategoriesRecord,
  searchTransactions as searchTransactionsRecord,
} from "src/server/common";
import { budgetMaxDays, budgetMaxYears } from "src/types/budget/methods";
import { BudgetSchema } from "src/types/budget/schema";
import type { Budget } from "src/types/budget/types";
import { CategorySchema } from "src/types/category/schema";
import type { Category } from "src/types/category/types";
import { TransactionCursorSchema, TransactionQuerySchema, TransactionSchema } from "src/types/transaction/schema";
import type { Transaction, TransactionCursor, TransactionPage, TransactionQuery } from "src/types/transaction/types";
import { datesDays } from "src/types/utils/methods";
import {
  cancelSubscription,
  createCheckoutSession as createCheckoutSessionRecord,
  createPortalSession as createPortalSessionRecord,
  getSubscription as getSubscriptionRecord,
} from "src/server/billing";
import {
  createLinkToken as createLinkTokenRecord,
  createUpdateLinkToken as createUpdateLinkTokenRecord,
  exchangePublicToken as exchangePublicTokenRecord,
  getPlaidConnections as getPlaidConnectionsRecord,
  removePlaidItem as removePlaidItemRecord,
  syncPlaidItemAccounts as syncPlaidItemAccountsRecord,
  syncTransactions as syncTransactionsRecord,
} from "src/server/plaid";
import {
  CreatePlaidUpdateLinkTokenSchema,
  ExchangePlaidPublicTokenSchema,
  SyncPlaidAccountsSchema,
} from "src/types/plaid/schema";
import type { PlaidConnection, PlaidConnections } from "src/types/plaid/types";
import type { Subscription } from "src/types/subscription/types";
import { supabase, userId } from "src/utils/supabase/server";

const TRANSACTIONS_SYNC_COOKIE = "transactions_synced_at";
const TRANSACTIONS_SYNC_COOLDOWN_MS = 6 * 60 * 60 * 1000;

const revalidateTransactionsSync = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(TRANSACTIONS_SYNC_COOKIE);
};

const PutBudgetSchema = BudgetSchema.omit({ categories: true }).refine(
  (value) => datesDays(value.dates) <= budgetMaxDays(),
  `Budget duration cannot exceed ${budgetMaxYears()} years`
);

const SearchTransactionsSchema = z.object({
  model: TransactionQuerySchema,
  cursor: TransactionCursorSchema.optional(),
  limit: z.number().min(10).max(100).default(25),
});

const revalidateBudget = (budgetId: string) => {
  revalidatePath("/budgets");
  revalidatePath(`/budgets/${budgetId}`);
  updateTag(tags.budget(budgetId));
};

const revalidateTransaction = (budgetId: string) => {
  revalidatePath("/transactions");
  revalidateBudget(budgetId);
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

export async function reorderCategories(budgetId: string, categoryIds: string[]): Promise<void> {
  const bid = z.string().min(1).parse(budgetId);
  const ids = z.array(z.string().min(1)).parse(categoryIds);
  const owner = await userId();
  await reorderCategoriesRecord(owner, bid, ids);
  revalidateBudget(bid);
}

export async function getBudgets(): Promise<Budget[]> {
  const owner = await userId();
  return getBudgetsRecord(owner);
}

export async function searchTransactions(
  model: TransactionQuery,
  cursor?: TransactionCursor,
  limit = 25
): Promise<TransactionPage> {
  const parsed = SearchTransactionsSchema.parse({ model, cursor, limit });
  const owner = await userId();
  return searchTransactionsRecord(owner, parsed.model, parsed.cursor, parsed.limit);
}

export async function putTransaction(transaction: Transaction): Promise<Transaction> {
  const parsed = TransactionSchema.parse(transaction);
  const owner = await userId();
  const result = await putTransactionRecord(owner, parsed);
  if (transaction.budget) revalidateTransaction(transaction.budget);
  if (result.budget) revalidateTransaction(result.budget);
  return result;
}

export async function deleteTransaction(transaction: Transaction): Promise<void> {
  const id = z.string().min(1).parse(transaction.id);
  const budgetId = z.string().min(1).parse(transaction.budget);
  const owner = await userId();
  await deleteTransactionRecord(owner, id);
  revalidateTransaction(budgetId);
}

export async function getSubscription(): Promise<Subscription> {
  const owner = await userId();
  return getSubscriptionRecord(owner);
}

export async function createCheckoutSession(): Promise<string> {
  const owner = await userId();
  return createCheckoutSessionRecord(owner);
}

export async function createPortalSession(): Promise<string> {
  const owner = await userId();
  return createPortalSessionRecord(owner);
}

export async function deleteAccount(): Promise<void> {
  const owner = await userId();
  await cancelSubscription(owner);
  const { error } = await supabase.auth.admin.deleteUser(owner);
  if (error) throw new Error(error.message);
}

export async function getPlaidConnections(): Promise<PlaidConnections> {
  const owner = await userId();
  return getPlaidConnectionsRecord(owner);
}

export async function createPlaidLinkToken(): Promise<string> {
  const owner = await userId();
  return createLinkTokenRecord(owner);
}

export async function createPlaidUpdateLinkToken(
  input: z.infer<typeof CreatePlaidUpdateLinkTokenSchema>
): Promise<string> {
  const owner = await userId();
  const parsed = CreatePlaidUpdateLinkTokenSchema.parse(input);
  return createUpdateLinkTokenRecord(owner, parsed.connectionId);
}

export async function exchangePlaidPublicToken(
  input: z.infer<typeof ExchangePlaidPublicTokenSchema>
): Promise<PlaidConnection> {
  const owner = await userId();
  const result = await exchangePublicTokenRecord(owner, input);
  await revalidateTransactionsSync();
  revalidatePath("/settings");
  return result;
}

export async function syncPlaidAccounts(input: z.infer<typeof SyncPlaidAccountsSchema>): Promise<PlaidConnection> {
  const owner = await userId();
  const parsed = SyncPlaidAccountsSchema.parse(input);
  const result = await syncPlaidItemAccountsRecord(owner, parsed.connectionId);
  await revalidateTransactionsSync();
  revalidatePath("/settings");
  return result;
}

export async function removePlaidItem(connectionId: string): Promise<void> {
  const owner = await userId();
  await removePlaidItemRecord(owner, connectionId);
  revalidatePath("/settings");
}

/**
 * Pulls new transactions from connected accounts.
 * @returns `true` if a sync ran. The client must call {@link markSyncCompleted}.
 */
export async function syncTransactions(): Promise<boolean> {
  const cookieStore = await cookies();
  const lastSyncedAt = Number(cookieStore.get(TRANSACTIONS_SYNC_COOKIE)?.value);
  if (Number.isFinite(lastSyncedAt) && Date.now() - lastSyncedAt < TRANSACTIONS_SYNC_COOLDOWN_MS) {
    return false;
  }

  const owner = await userId();
  await syncTransactionsRecord(owner);
  return true;
}

export async function markSyncCompleted(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TRANSACTIONS_SYNC_COOKIE, String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}
