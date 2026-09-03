"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Loader2, Plus, Sprout, Star } from "lucide-react";
import {
  ColumnDef,
  functionalUpdate,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { PageTitle } from "src/components/page-title";
import { Button } from "src/components/ui/button";
import { Collapsible, CollapsibleContent } from "src/components/ui/collapsible";
import { useBudgets, useTransactionsSearch } from "src/hooks/use-api";
import { markSyncCompleted } from "src/server/actions";
import { useIsMobile } from "src/hooks/use-mobile";
import { SearchModelOptions, useSearchModel } from "src/hooks/use-search";
import {
  TransactionFilterChips,
  TransactionFilterModel,
  TransactionFilterButton,
} from "src/sections/transactions/transaction-filter";
import { TransactionList } from "src/sections/transactions/transaction-list";
import { TransactionSearch } from "src/sections/transactions/transaction-search";
import { TransactionSidebar } from "src/sections/transactions/transaction-sidebar";
import {
  decodeTransactionsQuery,
  encodeTransactionsQuery,
  toTransactionQuery,
  type TransactionsUrlQuery,
} from "src/sections/transactions/transactions-query";
import { Budget } from "src/types/budget/types";
import { Category } from "src/types/category/types";
import { moneyFormat, moneyZero } from "src/types/money/methods";
import { Money } from "src/types/money/types";
import type { PlaidConnections } from "src/types/plaid/types";
import { SyncStatus, Transaction, TransactionQuery } from "src/types/transaction/types";
import { asDateString, dateFormatShort } from "src/types/utils/methods";
import { Separator } from "src/components/ui/separator";
import { cn } from "@/utils";

export function TransactionsTitle({ shimmer, actions }: { shimmer?: boolean; actions?: ReactNode }) {
  return (
    <div className="flex items-center gap-1">
      <PageTitle title="Transactions" className={cn(shimmer && "text-shimmer")} />
      <div className="flex size-9 items-center justify-center">{actions}</div>
    </div>
  );
}

/* ================================================================================================================= *
 * URL model                                                                                                         *
 * ================================================================================================================= */

const useTransactionsModel = ({ budgets }: { budgets: readonly Budget[] | undefined }) => {
  const encodeQuery: SearchModelOptions<TransactionsUrlQuery>["encodeQuery"] = useCallback((query, params) => {
    encodeTransactionsQuery(query, params);
  }, []);

  const decodeQuery: SearchModelOptions<TransactionsUrlQuery>["decodeQuery"] = useCallback(
    (params) => decodeTransactionsQuery(params, budgets),
    [budgets]
  );

  const { query, setQuery } = useSearchModel<TransactionsUrlQuery>({
    href: "/transactions",
    encodeQuery,
    decodeQuery,
  });

  const model: TransactionQuery = useMemo(() => toTransactionQuery(query), [query]);
  return {
    ...query,
    model,
    setSearch: useCallback((search?: string) => setQuery((q) => ({ ...q, search })), [setQuery]),
    setSort: useCallback((sort: SortingState) => setQuery((q) => ({ ...q, sorting: sort })), [setQuery]),
    setFilter: useCallback((filter: TransactionFilterModel) => setQuery((q) => ({ ...q, filter })), [setQuery]),
  };
};

/* ================================================================================================================= *
 * Page                                                                                                              *
 * ================================================================================================================= */

const emptyTransaction = (): Transaction => ({
  id: "",
  budget: "",
  category: "",
  date: "",
  amount: moneyZero(),
  name: "",
  lastModified: "",
  starred: false,
  note: "",
  sync: undefined,
});

const getBudget = (row: Row<Transaction>, budgets: readonly Budget[] | undefined): Budget | undefined =>
  budgets?.find((b) => b.id === row.original.budget);

const getCategory = (row: Row<Transaction>, budget: Budget | undefined): Category | undefined =>
  budget?.categories.find((c) => c.id === row.original.category);

export function TransactionsPage({ plaid, didSync }: { plaid: PlaidConnections; didSync: boolean }) {
  useEffect(() => {
    if (didSync) markSyncCompleted();
  }, [didSync]);

  const { budgets, error: budgetsError } = useBudgets();
  const { search, sorting, filter, setSearch, setSort, setFilter, model } = useTransactionsModel({ budgets });
  const mobile = useIsMobile();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTrx, setSidebarTrx] = useState<Transaction>(emptyTransaction);

  const {
    transactions,
    error: trxError,
    applyPut,
    applyDelete,
    starTransaction,
    fetchMore,
    isLoading,
    isValidating,
  } = useTransactionsSearch(model);

  const columns = useMemo<ColumnDef<Transaction>[]>(() => {
    return [
      {
        id: "star",
        cell: ({ row }) =>
          row.original.sync?.status === SyncStatus.Pending ? (
            <span className="inline-flex items-center justify-center align-middle">
              <Sprout className="size-3.5 fill-primary text-primary" />
            </span>
          ) : (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md align-middle"
              onClick={(evt) => {
                starTransaction(row.original, !row.original.starred);
                evt.stopPropagation();
              }}
            >
              <Star
                className={
                  row.original.starred ? "size-3.5 fill-primary text-primary" : "size-3.5 text-muted-foreground"
                }
              />
            </button>
          ),
        enableSorting: false,
        maxSize: mobile ? 10 : 5,
        meta: { center: true },
      },
      {
        id: "date",
        accessorKey: "date",
        header: "Date",
        cell: ({ getValue }) => dateFormatShort(getValue<string>()),
        maxSize: mobile ? 30 : 12.5,
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: "Amount",
        cell: ({ getValue }) => moneyFormat(getValue<Money>(), { keepZero: true }),
        maxSize: mobile ? 30 : 12.5,
      },
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        cell: ({ row, getValue }) => {
          const accountId = row.original.sync?.details.account_id;
          const logo = accountId
            ? plaid.connections.find((connection) => connection.accounts.some((account) => account.id === accountId))
                ?.institutionLogo
            : undefined;
          return (
            <div className="flex min-w-0 items-center gap-1.5">
              {logo ? (
                <img
                  src={`data:image/png;base64,${logo}`}
                  alt=""
                  className="size-5 shrink-0 rounded-full object-cover ring-1 ring-border"
                />
              ) : null}
              <span className="truncate">{getValue<string>()}</span>
            </div>
          );
        },
        maxSize: mobile ? 30 : 35,
      },
      ...(!mobile
        ? ([
            {
              id: "budgetName",
              accessorKey: "budget",
              header: "Budget",
              cell: ({ row }) => getBudget(row, budgets)?.name,
              maxSize: 17.5,
            },
            {
              id: "categoryName",
              accessorKey: "category",
              header: "Category",
              cell: ({ row }) => getCategory(row, getBudget(row, budgets))?.name,
              maxSize: 17.5,
            },
          ] as ColumnDef<Transaction>[])
        : []),
    ];
  }, [mobile, budgets, starTransaction, plaid]);

  const data = useMemo(() => transactions?.flatMap((page) => page.transactions) ?? [], [transactions]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (sort) => setSort(functionalUpdate(sort, sorting)),
    manualSorting: true,
  });

  const showLoadMore = !!fetchMore;
  const count = transactions?.[0]?.meta?.count;
  const error = budgetsError || trxError;

  return (
    <div className="flex flex-col gap-3">
      <TransactionsTitle
        shimmer={isLoading}
        actions={
          budgets && budgets.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setSidebarTrx({
                  ...emptyTransaction(),
                  budget: budgets[0]?.id ?? null,
                  date: asDateString(new Date()),
                  amount: null as unknown as Money,
                });
                setSidebarOpen(true);
              }}
            >
              <Plus className="size-4" />
              <span className="sr-only">New Transaction</span>
            </Button>
          ) : null
        }
      />

      <TransactionSidebar
        budgets={budgets ?? []}
        plaid={plaid}
        transaction={sidebarTrx}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onUpdate={async (trx) => {
          await applyPut(trx);
          setSidebarOpen(false);
        }}
        onDelete={async (trx) => {
          await applyDelete(trx);
          setSidebarOpen(false);
        }}
      />

      {error ? (
        <div className="my-6">
          <Separator />
          <div className="flex h-12 flex-col items-center justify-center gap-1 py-6">
            <p className="text-sm text-foreground">Oops. An error occurred.</p>
            {error.message && <p className="text-xs text-muted-foreground">{error.message}</p>}
          </div>
          <Separator />
        </div>
      ) : (
        <>
          <div className="flex animate-in fade-in flex-col gap-3 duration-300">
            <TransactionSearch fullWidth search={search} setSearch={setSearch} />
            <Collapsible open={typeof count === "number"}>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                {typeof count === "number" && (
                  <p className="text-xs text-muted-foreground">Found {count} transactions</p>
                )}
              </CollapsibleContent>
            </Collapsible>
            <TransactionFilterChips filter={filter} setFilter={setFilter} budgets={budgets}>
              <TransactionFilterButton filter={filter} setFilter={setFilter} budgets={budgets} />
            </TransactionFilterChips>
          </div>
          <TransactionList
            table={table}
            setSidebarTrx={(trx) => {
              setSidebarTrx({
                ...trx,
                ...(budgets && !trx.budget ? { budget: budgets[0]?.id ?? null } : {}),
              });
              setSidebarOpen(true);
            }}
          />
          {showLoadMore && (
            <Button variant="outline" disabled={isValidating} className="w-full" onClick={fetchMore}>
              {isValidating && <Loader2 className="size-4 animate-spin" />}
              Load more
            </Button>
          )}
        </>
      )}
    </div>
  );
}
