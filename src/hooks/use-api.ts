import { produce, Draft } from "immer";
import useSWR, { useSWRConfig } from "swr";
import { useAuth } from "./use-auth";
import type { Budget } from "src/types/budget/types";
import { useCallback, useMemo } from "react";
import { Category } from "src/types/category/types";
import { Transaction, TransactionPage, TransactionQuery } from "src/types/transaction/types";
import { http } from "src/utils/http";
import useSWRInfinite from "swr/infinite";
import { isEqual } from "lodash";

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
const ApiTransactionsSearch = "/transactions/search";

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
            const index = draft.categories.findIndex((c) => c.id === category.id);
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
            const index = draft.categories.findIndex((c) => c.id === category);
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
 * Returns a copy of the transaction cache with one transaction modified.
 * @param cache       The transaction cache
 * @param id          The id of the transaction to change
 * @param change      Either a transaction to upsert or a function to modify the existing transaction.
 *                    If a transaction, will insert to the cache if no such transaction exists, otherwise will update.
 *                    If a function, will call with existing transaction to get update. If undefined returned, will remove that transaction.
 * @returns           The updated cache
 */
const mutateTransactions = (
  cache: TransactionPage[] | undefined,
  id: string,
  change: Transaction | ((trx: Draft<Transaction>) => Transaction | undefined)
): TransactionPage[] | undefined => {
  if (!cache) return cache;
  return produce(cache, (draft) => {
    let modified = false;
    for (let pageIdx = 0; pageIdx < draft.length; pageIdx++) {
      const page = draft[pageIdx].transactions;
      for (let trxIdx = page.length - 1; trxIdx >= 0; trxIdx--) {
        const trx = page[trxIdx];
        if (trx.id !== id) continue;

        if (typeof change === "function") {
          const updated = change(trx);
          if (updated === undefined) page.splice(trxIdx, 1);
          else page[trxIdx] = updated;
        } else page[pageIdx] = change;

        modified = true;
      }
    }

    if (!modified && typeof change !== "function") {
      if (draft.length === 0) draft.push({ transactions: [change], cursor: undefined });
      else draft[0].transactions.unshift(change);
      modified = true;
    }
  });
};

export const useTransactionsSearch = (query: TransactionQuery) => {
  const { token } = useAuth();
  const { mutate: invalidate } = useSWRConfig();

  /** Every page key has the format: [TAG, CURSOR, QUERY_MODEL] */
  const { data, isValidating, isLoading, setSize, mutate, error } = useSWRInfinite(
    (_, previousPage?: TransactionPage) => [ApiTransactionsSearch, previousPage?.cursor, query],
    ([_, cursor, model]) =>
      http<TransactionPage>(ApiTransactionsSearch, "POST", {
        token,
        data: { cursor, model },
      }),
    { revalidateFirstPage: false }
  );

  /**
   * Invalidates all transaction queries, except for the current one.
   * When changing a transaction, we expect to get updated data when entering a new query.
   * However, we want to avoid fetching the current query, as it may lead to a jittery UX.
   * @param budget    The budget to invalidate, if desired.
   */
  const invalidateQueries = useCallback(
    (budget?: string) => {
      const promises: Promise<any>[] = [
        invalidate((key) => {
          if (!Array.isArray(key)) return false;
          if (key.length !== 3) return false;
          if (key[0] !== ApiTransactionsSearch) return false;
          if (isEqual(key[2], query)) return false;
          return true;
        }),
      ];

      if (budget) {
        promises.push(invalidate(ApiBudgets));
        promises.push(invalidate(ApiBudgetsId(budget)));
      }

      return Promise.all(promises);
    },
    [invalidate, query]
  );

  const canFetchNext = useMemo(() => {
    // If there is no data yet or we are loading, it doesn't make sense to fetch more.
    // If the last data page has no rows or no cursor, we also cannot fetch more rows.
    if (isLoading || isValidating || data === undefined) return false;
    if (data.length === 0) return true;
    const lastPage = data[data.length - 1];
    return lastPage.transactions.length > 0 && !!lastPage.cursor;
  }, [data, isLoading, isValidating]);

  const fetchMore = useMemo(() => {
    if (!canFetchNext) return undefined;
    return () => {
      setSize((size) => size + 1);
    };
  }, [canFetchNext, setSize]);

  const putTransaction = useCallback(
    async (transaction: Transaction) => {
      await mutate(
        async (cache) => {
          transaction = await http(ApiTransactions, "PUT", { token, data: { transaction } });

          // Changing a transaction may affect what is shown for its budget, so we must invalidate those.
          await invalidateQueries(transaction.budget);
          return mutateTransactions(cache, transaction.id, transaction);
        },
        { revalidate: false }
      );
    },
    [mutate, token, invalidateQueries]
  );

  const starTransaction = useCallback(
    async (transaction: Transaction, starred: boolean) => {
      transaction = produce(transaction, (draft) => {
        draft.starred = starred;
      });

      await mutate(
        async (cache) => {
          /* Note: starring a transaction shouldn't change any other app state, so no need to invalidate them */
          await http(ApiTransactions, "PUT", { token, data: { transaction } });
          await invalidateQueries();
          return mutateTransactions(cache, transaction.id, () => transaction);
        },
        {
          revalidate: false,

          /* Note: optimisticData does not allow returning undefined. Is returning [] a problem here? */
          optimisticData: (cache) => mutateTransactions(cache, transaction.id, () => transaction) ?? [],
        }
      );
    },
    [invalidateQueries, mutate, token]
  );

  const deleteTransaction = useCallback(
    async (transaction: Transaction) => {
      await mutate(
        async (cache) => {
          await http(ApiTransactionsId(transaction.id), "DELETE", { token });

          // Deleting a transaction may affect what is shown for its budget, so we must invalidate those.
          await invalidateQueries(transaction.budget);
          return mutateTransactions(cache, transaction.id, () => undefined);
        },
        { revalidate: false }
      );
    },
    [mutate, token, invalidateQueries]
  );

  return {
    /** The transaction data received so far */
    transactions: data?.flatMap((page) => page.transactions),

    /** The error that occurred while fetching transactions, if any */
    error,

    /** `true` whenever there is an ongoing request whether the data is loaded or not */
    isLoading,

    /** `true` when there is an ongoing request and data is not loaded yet */
    isValidating,

    /** Upserts a transaction */
    putTransaction,

    /** Optimistically stars a transaction */
    starTransaction,

    /** Deletes a transaction */
    deleteTransaction,

    /** Fetches the next page of transaction data. `undefined` if fetching is currently not allowed */
    fetchMore,
  };
};
