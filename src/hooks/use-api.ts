import { produce, type Immutable, Draft } from "immer";
import useSWR, { useSWRConfig } from "swr";
import { useAuth } from "./use-auth";
import type { Budget } from "src/types/budget/types";
import { useCallback } from "react";
import { Category } from "src/types/category/types";
import { Transaction } from "src/types/transaction/types";
import { http } from "src/utils/http";
import { transactionCompare } from "src/types/transaction/methods";

const fetcher = (token?: string) => (path: string) => http(path, "GET", { token }) as any;

/* ================================================================================================================= *
 * API Paths & Cache Keys                                                                                            *
 * ================================================================================================================= */

const ApiBudgets = "/budgets";
const ApiBudgetsId = (budget: string) => `${ApiBudgets}/${budget}`;
const ApiBudgetsCategory = (budget: string) => `${ApiBudgetsId(budget)}/categories`;
const ApiBudgetsCategoryId = (budget: string, category: string) => `${ApiBudgetsCategory(budget)}/${category}`;
const ApiTransactions = "/transactions";
const ApiTransactionsId = (trx: string) => `${ApiTransactions}/${trx}`;

/* ================================================================================================================= *
 * API Methods                                                                                                       *
 * ================================================================================================================= */

export const useBudgets = () => {
  const { token } = useAuth();
  const { mutate } = useSWRConfig();
  const { data, error, isLoading } = useSWR<readonly Budget[]>(token ? ApiBudgets : null, async (path: string) => {
    const result: readonly Budget[] = await fetcher(token)(path);
    result.forEach((b) => mutate(ApiBudgetsId(b.id), b, { revalidate: false }));
    return result;
  });
  return {
    budgets: data,
    error,
    isLoading,
  };
};

export const useBudget = (id: string) => {
  const { token } = useAuth();
  const { data, error, isLoading } = useSWR<Budget>(token ? ApiBudgetsId(id) : null, fetcher(token));
  return {
    budget: data,
    error,
    isLoading,
  };
};

export const useBudgetChanges = () => {
  const { token } = useAuth();
  const { mutate } = useSWRConfig();

  const putBudget = useCallback(
    async (budget: Budget) => {
      await mutate(
        ApiBudgetsId(budget.id),
        async () => {
          budget = await http(ApiBudgets, "PUT", { token, data: { budget } });
          await mutate(ApiBudgets);
          return budget;
        },
        { revalidate: false }
      );
      return budget;
    },
    [token, mutate]
  );

  const deleteBudget = useCallback(
    async (budget: Budget) => {
      await mutate(
        ApiBudgetsId(budget.id),
        async () => {
          await http(ApiBudgetsId(budget.id), "DELETE", { token });
          await mutate(ApiBudgets);
          await mutate(ApiTransactions);
          return undefined;
        },
        { revalidate: false }
      );
    },
    [token, mutate]
  );

  return { putBudget, deleteBudget };
};

export const useCategoryChanges = () => {
  const { token } = useAuth();
  const { mutate } = useSWRConfig();

  const putCategory = useCallback(
    async (budget: string, category: Category) => {
      await mutate(
        ApiBudgetsId(budget),
        async (existing?: Budget) => {
          category = await http(ApiBudgetsCategory(budget), "PUT", { token, data: { category } });
          await mutate(ApiBudgets);
          if (!existing) return undefined;
          return produce(existing, (draft) => {
            const index = draft.categories.findIndex(c => c.id === category.id);
            if (index >= 0) draft.categories[index] = category as Draft<Category>;
            else draft.categories.push(category as Draft<Category>);
          });
        },
        { revalidate: false }
      );
      return category;
    },
    [token, mutate]
  );

  const deleteCategory = useCallback(
    async (budget: string, category: string) => {
      await mutate(
        ApiBudgetsId(budget),
        async (existing?: Budget) => {
          await http(ApiBudgetsCategoryId(budget, category), "DELETE", { token });
          await mutate(ApiBudgets);
          await mutate(ApiTransactions);
          if (!existing) return undefined;
          return produce(existing, (draft) => {
            const index = draft.categories.findIndex(c => c.id === category);
            if (index >= 0) draft.categories.splice(index, 1);
          });
        },
        { revalidate: false }
      );
    },
    [token, mutate]
  );

  return { putCategory, deleteCategory };
};

/**
 * Updates the transaction cache with a transaction, returning a new copy of the cache.
 * @param cache The transaction cache.
 * @param trx The transaction to update.
 * @param remove Whether or not to remove the given transaction
 * @returns A copy of the cache.
 */
const placeTransaction = (
  cache: readonly Transaction[] | undefined,
  trx: Transaction,
  remove: boolean
): readonly Transaction[] | undefined => {
  if (!cache) return cache;
  if (!trx.id) return cache;
  return produce(cache, (draft) => {
    const index = draft.findIndex(t => t.id === trx.id);
    if (remove) {
      if (index >= 0) draft.splice(index, 1);
      return;
    }

    if (index >= 0) draft[index] = trx;
    else draft.push(trx);
    draft.sort(transactionCompare);
  });
};

export const useTransactions = () => {
  const { token } = useAuth();
  const { mutate: globalMutate } = useSWRConfig();
  const { data, error, isLoading, mutate } = useSWR<readonly Transaction[]>(
    token ? ApiTransactions : null,
    fetcher(token)
  );

  const modifyTransaction = useCallback(
    async (trx: Transaction, remove: boolean) => {
      await mutate(
        async (cache) => {
          if (remove) await http(ApiTransactionsId(trx.id), "DELETE", { token });
          else {
            trx = await http(ApiTransactions, "PUT", { token, data: { transaction: trx } });
            await mutate((cache) => placeTransaction(cache, trx, false), { revalidate: false });
          }
          await globalMutate(ApiBudgets);
          await globalMutate(ApiBudgetsId(trx.budget));
          return placeTransaction(cache, trx, remove);
        },
        { revalidate: false }
      );
    },
    [mutate, globalMutate]
  );

  const starTransaction = useCallback((trx: Transaction, star: boolean) => {
    mutate(
      (cache) => {
        trx = produce(trx, (draft) => {
          draft.starred = star;
        });
        modifyTransaction(trx, false);
        return placeTransaction(cache, trx, false);
      },
      { revalidate: false }
    );
  }, [mutate, modifyTransaction]);

  return {
    transactions: data,
    error,
    isLoading,
    putTransaction: (trx: Transaction) => modifyTransaction(trx, false),
    deleteTransaction: (trx: Transaction) => modifyTransaction(trx, true),
    starTransaction,
  };
};