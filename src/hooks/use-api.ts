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
 * API Methods                                                                                                       *
 * ================================================================================================================= */

export const useBudgets = () => {
  const { token } = useAuth();
  const { data, error, isLoading } = useSWR<readonly Budget[]>(token ? `/budgets` : null, fetcher(token));
  return {
    budgets: data,
    error,
    isLoading,
  };
};

export const useBudget = (id: string) => {
  const { token } = useAuth();
  const { data, error, isLoading } = useSWR<Budget>(token ? `/budgets/${id}` : null, fetcher(token));
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
        `/budgets/${budget.id}`,
        async () => {
          budget = await http("/budgets", "PUT", { token, data: { budget } });
          await mutate(`/budgets`);
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
      const path = `/budgets/${budget.id}`;
      await mutate(
        path,
        async () => {
          await http(path, "DELETE", { token });
          await mutate(`/budgets`);
          // TODO: Invalidate transactions
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
        `/budgets/${budget}`,
        async (existing?: Budget) => {
          category = await http(`/budgets/${budget}/categories`, "PUT", { token, data: { category } });
          await mutate(`/budgets`);
          if (!existing) return undefined;
          return produce(existing, (draft) => {
            for (let i = 0; i < draft.categories.length; i++) {
              if (draft.categories[i].id === category.id) {
                draft.categories[i] = category as Draft<Category>;
                return;
              }
            }

            draft.categories.push(category as Draft<Category>);
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
      const path = `/budgets/${budget}`;
      await mutate(
        path,
        async (existing?: Budget) => {
          await http(`/budgets/${budget}/categories/${category}`, "DELETE", { token });
          await mutate(`/budgets`);
          // TODO: Invalidate transactions
          if (!existing) return undefined;
          return produce(existing, (draft) => {
            for (let i = 0; i < draft.categories.length; i++) {
              if (draft.categories[i].id === category) {
                draft.categories.splice(i, 1);
                return;
              }
            }
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
 * @param trx The transaction to update. If a string is given, deletes the transaction with that id.
 * @returns A copy of the cache.
 */
const placeTransaction = (
  cache: readonly Transaction[] | undefined,
  trx: string | Transaction
): readonly Transaction[] | undefined => {
  if (!cache) return cache;
  return produce(cache, (draft) => {
    const remove = typeof trx === "string";
    const id = remove ? trx : trx.id;
    for (let i = 0; i < draft.length; i++) {
      if (draft[i].id === id) {
        if (remove) draft.splice(i, 1);
        else {
          draft[i] = trx;
          draft.sort(transactionCompare);
        }
        return;
      }
    }

    if (!remove) {
      draft.push(trx);
      draft.sort(transactionCompare);
    }
  });
};

export const useTransactions = () => {
  const { token } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<readonly Transaction[]>(
    token ? `/transactions` : null,
    fetcher(token)
  );

  const putTransaction = useCallback(
    async (trx: Transaction) =>
      mutate(
        async (cache) => {
          trx = await http("/transactions", "PUT", { token, data: { transaction: trx } });
          return placeTransaction(cache, trx);
        },
        {
          optimisticData: (cache) => placeTransaction(cache, trx) ?? [],
          revalidate: false
        }
      ),
    [mutate]
  );

  const deleteTransaction = useCallback(
    async (trx: Transaction) =>
      mutate(
        async (cache) => {
          await http(`/transactions/${trx.id}`, "DELETE", { token });
          return placeTransaction(cache, trx.id);
        },
        {
          optimisticData: (cache) => placeTransaction(cache, trx.id) ?? [],
          revalidate: false
        }
      ),
    [mutate]
  );

  return {
    transactions: data,
    error,
    isLoading,
    putTransaction,
    deleteTransaction,
  };
};
