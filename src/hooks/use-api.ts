import { produce, Draft } from "immer";
import useSWR, { useSWRConfig } from "swr";
import { useCallback, useMemo } from "react";
import {
  deleteTransaction as deleteTransactionAction,
  getBudgets,
  putTransaction as putTransactionAction,
  searchTransactions,
} from "src/server/actions";
import type { Budget } from "src/types/budget/types";
import { Transaction, TransactionPage, TransactionQuery } from "src/types/transaction/types";
import useSWRInfinite from "swr/infinite";
import { isEqual } from "lodash";
import { toast } from "sonner";

/* ================================================================================================================= *
 * Cache Keys                                                                                                        *
 * ================================================================================================================= */

export const BudgetsKey = "budgets";
export const TransactionsSearchKey = "transactions/search";

/* ================================================================================================================= *
 * Budgets                                                                                                           *
 * ================================================================================================================= */

export const useBudgets = () => {
  const { data, error, isLoading } = useSWR<readonly Budget[]>(BudgetsKey, () => getBudgets());
  return {
    budgets: data,
    error,
    isLoading,
  };
};

/* ================================================================================================================= *
 * Transactions                                                                                                      *
 * ================================================================================================================= */

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
    let rowsAdded = 0;
    let modified = false;
    for (let pageIdx = 0; pageIdx < draft.length; pageIdx++) {
      const page = draft[pageIdx].transactions;
      for (let trxIdx = page.length - 1; trxIdx >= 0; trxIdx--) {
        const trx = page[trxIdx];
        if (trx.id !== id) continue;

        if (typeof change === "function") {
          const updated = change(trx);
          if (updated === undefined) {
            page.splice(trxIdx, 1);
            rowsAdded--;
          } else page[trxIdx] = updated;
        } else page[trxIdx] = change;

        modified = true;
      }
    }

    if (!modified && typeof change !== "function") {
      if (draft.length === 0) draft.push({ transactions: [change], cursor: undefined, meta: { count: 1 } });
      else draft[0].transactions.unshift(change);
      rowsAdded++;
      modified = true;
    }

    if (modified && draft.length > 0) {
      if (!draft[0].meta.count) draft[0].meta.count = 0;
      draft[0].meta.count += rowsAdded;
    }
  });
};

export const useTransactionsSearch = (query: TransactionQuery) => {
  const { mutate: invalidate } = useSWRConfig();

  /** Every page key has the format: [TAG, CURSOR, QUERY_MODEL] */
  const { data, isValidating, isLoading, setSize, mutate, error } = useSWRInfinite(
    (_, previousPage?: TransactionPage) => [TransactionsSearchKey, previousPage?.cursor, query],
    ([_, cursor, model]: [string, TransactionPage["cursor"], TransactionQuery]) =>
      searchTransactions(model, cursor ?? undefined),
    { keepPreviousData: true }
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
        invalidate(
          (key) => {
            if (!Array.isArray(key)) return false;
            if (key.length !== 3) return false;
            if (key[0] !== TransactionsSearchKey) return false;
            if (isEqual(key[2], query)) return false;
            return true;
          },
          undefined,
          { revalidate: true }
        ),
      ];

      if (budget) {
        promises.push(invalidate(BudgetsKey));
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

  /** Apply a saved transaction to the local SWR cache (server write already happened). */
  const applyPut = useCallback(
    async (transaction: Transaction) => {
      await mutate((cache) => mutateTransactions(cache, transaction.id, transaction), { revalidate: false });
      await invalidateQueries(transaction.budget);
    },
    [mutate, invalidateQueries]
  );

  /** Optimistically stars a transaction and persists via server action. */
  const starTransaction = useCallback(
    async (transaction: Transaction, starred: boolean) => {
      const newTransaction = produce(transaction, (draft) => {
        draft.starred = starred;
      });

      await mutate(
        async (cache) => {
          putTransactionAction(newTransaction).catch((err) => {
            console.error(err);
            toast.error(`Couldn't ${newTransaction.starred ? "star" : "unstar"} transaction`);
            mutate((cache) => mutateTransactions(cache, transaction.id, () => transaction));
          });
          invalidateQueries();
          return mutateTransactions(cache, transaction.id, () => newTransaction);
        },
        { revalidate: false }
      );
    },
    [invalidateQueries, mutate]
  );

  /** Apply a deleted transaction to the local SWR cache (server write already happened). */
  const applyDelete = useCallback(
    async (transaction: Transaction) => {
      await mutate((cache) => mutateTransactions(cache, transaction.id, () => undefined), { revalidate: false });
      await invalidateQueries(transaction.budget);
    },
    [mutate, invalidateQueries]
  );

  return {
    /** The transaction data received so far */
    transactions: data,

    /** The error that occurred while fetching transactions, if any */
    error,

    /** `true` whenever there is an ongoing request whether the data is loaded or not */
    isLoading,

    /** `true` when there is an ongoing request and data is not loaded yet */
    isValidating,

    /** Apply an upserted transaction to the cache */
    applyPut,

    /** Optimistically stars a transaction */
    starTransaction,

    /** Apply a deleted transaction to the cache */
    applyDelete,

    /** Fetches the next page of transaction data. `undefined` if fetching is currently not allowed */
    fetchMore,
  };
};
