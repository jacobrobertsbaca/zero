import { Layout as DashboardLayout } from "src/layouts/dashboard/layout";
import { PageTitle } from "src/components/page-title";
import { TransactionSidebar } from "src/sections/transactions/transaction-sidebar";
import { useCallback, useMemo, useState } from "react";
import { Transaction, TransactionQuery } from "src/types/transaction/types";
import { moneyFormat, moneyZero } from "src/types/money/methods";
import { useBudgets, useTransactionsSearch } from "src/hooks/use-api";
import { useIsMobile } from "src/hooks/use-mobile";

import { Loader2, Plus, Star } from "lucide-react";
import { Budget } from "src/types/budget/types";
import { asDateString, dateFormatShort } from "src/types/utils/methods";
import { Money } from "src/types/money/types";
import { TransactionSearch } from "src/sections/transactions/transaction-search";
import {
  ColumnDef,
  functionalUpdate,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { Category } from "src/types/category/types";
import { TransactionList } from "src/sections/transactions/transaction-list";
import { Button } from "src/components/ui/button";
import { Loading } from "src/components/loading";
import { SearchModelOptions, useSearchModel } from "src/hooks/use-search";
import { TransactionSearchColumnSchema } from "src/types/transaction/schema";
import {
  decodeFilterModel,
  encodeFilterModel,
  filterModelToFilters,
  TransactionFilterChips,
  TransactionFilterModel,
  TransactionFilterButton,
} from "src/sections/transactions/transaction-filter";

/* ================================================================================================================= *
 * URLSearchParams Handling                                                                                          *
 * ================================================================================================================= */

type Query = {
  search?: string;
  sorting: SortingState;
  filter: TransactionFilterModel;
};

const convertQuery = (query: Query): TransactionQuery => {
  return {
    search: query.search,
    sort: query.sorting.map((sort) => ({ column: sort.id as any, ascending: !sort.desc })),
    filter: filterModelToFilters(query.filter),
  };
};

const useTransactionsModel = ({ budgets }: { budgets: readonly Budget[] | undefined }) => {
  const encodeQuery: SearchModelOptions<Query>["encodeQuery"] = useCallback((query, params) => {
    if (query.search) params.set("search", query.search);
    query.sorting.forEach((sort) => {
      params.append("sort", `${sort.desc ? "-" : ""}${sort.id}`);
    });
    encodeFilterModel(query.filter, params);
  }, []);

  const decodeQuery: SearchModelOptions<Query>["decodeQuery"] = useCallback(
    (params) => {
      const search = params.get("search") ?? undefined;
      const sorting = params
        .getAll("sort")
        .map((column) => {
          const desc = column.startsWith("-");
          if (desc) column = column.slice(1);
          const result = TransactionSearchColumnSchema.safeParse(column);
          if (!result.success) return undefined;
          return { id: column, desc };
        })
        .filter((sort) => !!sort);
      const filter = decodeFilterModel(params, budgets);
      return { search, sorting, filter };
    },
    [budgets]
  );

  const { query, setQuery } = useSearchModel<Query>({
    href: "/transactions",
    encodeQuery,
    decodeQuery,
  });

  const model: TransactionQuery = useMemo(() => convertQuery(query), [query]);
  return {
    ...query,
    model,
    setSearch: useCallback((search?: string) => setQuery((query) => ({ ...query, search })), [setQuery]),
    setSort: useCallback((sort: SortingState) => setQuery((query) => ({ ...query, sorting: sort })), [setQuery]),
    setFilter: useCallback((filter: TransactionFilterModel) => setQuery((query) => ({ ...query, filter })), [setQuery]),
  };
};

/* ================================================================================================================= *
 * Transactions Page                                                                                                 *
 * ================================================================================================================= */

const getBudget = (row: Row<Transaction>, budgets: readonly Budget[] | undefined): Budget | undefined => {
  if (!budgets) return undefined;
  return budgets.find((b) => b.id === row.original.budget);
};

const getCategory = (row: Row<Transaction>, budget: Budget | undefined): Category | undefined => {
  if (!budget) return undefined;
  return budget.categories.find((c) => c.id === row.original.category);
};

const Page = () => {
  const { budgets, error: budgetsError } = useBudgets();
  const { search, sorting, filter, setSearch, setSort, setFilter, model } = useTransactionsModel({ budgets });

  const mobile = useIsMobile();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTrx, setSidebarTrx] = useState<Transaction>({
    id: "",
    budget: "",
    category: "",
    date: "",
    amount: moneyZero(),
    name: "",
    lastModified: "",
    starred: false,
    note: "",
  });

  const addTransaction = useCallback((budgets: readonly Budget[]) => {
    setSidebarTrx({
      id: "",
      budget: budgets[0].id, // 1st budget should be active, assumes budgets in sorted order
      category: "",
      date: asDateString(new Date()), // Today
      amount: null as unknown as Money, // Setting to null default MoneyField to empty value
      name: "",
      lastModified: "",
      starred: false,
      note: "",
    });
    setSidebarOpen(true);
  }, []);

  const {
    transactions,
    error: trxError,
    putTransaction,
    deleteTransaction,
    starTransaction,
    fetchMore,
    isValidating,
    isLoading,
  } = useTransactionsSearch(model);

  const columns = useMemo<ColumnDef<Transaction>[]>(() => {
    return [
      {
        id: "star",
        cell: ({ row }) => (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md align-middle"
            onClick={(evt) => {
              starTransaction(row.original, !row.original.starred);
              evt.stopPropagation();
            }}
          >
            <Star
              className={row.original.starred ? "size-3.5 fill-primary text-primary" : "size-3.5 text-muted-foreground"}
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
        meta: { ellipsis: true },
      },
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        meta: { ellipsis: true },
        maxSize: mobile ? 30 : 35,
      },

      // Only show these column on wide displays
      ...(!mobile
        ? ([
            {
              id: "budgetName", // Use "budgetName" instead of "budget" for correct remote sorting
              accessorKey: "budget",
              header: "Budget",
              cell: ({ row }) => getBudget(row, budgets)?.name,
              maxSize: 17.5,
              meta: { ellipsis: true },
            },
            {
              id: "categoryName", // Use "categoryName" instead of "category" for correct remote sorting
              accessorKey: "category",
              header: "Category",
              cell: ({ row }) => getCategory(row, getBudget(row, budgets))?.name,
              maxSize: 17.5,
              meta: { ellipsis: true },
            },
          ] as ColumnDef<Transaction>[])
        : []),
    ];
  }, [mobile, budgets, starTransaction]);

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

  /* Can't fetch any more pages if fetching disabled AND we're not loading a page */
  const canFetch = !!fetchMore || isValidating;
  const count = transactions?.[0].meta?.count;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <PageTitle title="Transactions" />
        {budgets && budgets.length > 0 && (
          <Button type="button" variant="ghost" size="icon" onClick={() => addTransaction(budgets)}>
            <Plus className="size-4" />
            <span className="sr-only">New Transaction</span>
          </Button>
        )}
        <TransactionSidebar
          budgets={budgets ?? []}
          transaction={sidebarTrx}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onUpdate={async (trx) => {
            await putTransaction(trx);
            setSidebarOpen(false);
          }}
          onDelete={async (trx) => {
            await deleteTransaction(trx);
            setSidebarOpen(false);
          }}
        />
      </div>

      <Loading error={budgetsError || trxError} loading={false}>
        <TransactionSearch fullWidth search={search} setSearch={setSearch} />
        {count ? <p className="text-xs text-muted-foreground">Found {count} transactions</p> : null}
        <TransactionFilterChips filter={filter} setFilter={setFilter} budgets={budgets}>
          <TransactionFilterButton filter={filter} setFilter={setFilter} budgets={budgets} />
        </TransactionFilterChips>
        <TransactionList
          table={table}
          setSidebarTrx={(trx) => {
            setSidebarTrx(trx);
            setSidebarOpen(true);
          }}
          isLoading={isLoading}
        />

        {canFetch && (
          <Button variant="outline" disabled={isValidating} className="w-full" onClick={fetchMore}>
            {isValidating && <Loader2 className="size-4 animate-spin" />}
            Load more
          </Button>
        )}
      </Loading>
    </div>
  );
};

Page.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
