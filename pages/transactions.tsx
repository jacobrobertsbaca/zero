import { Box, IconButton, Stack, SvgIcon, Typography, useMediaQuery, useTheme } from "@mui/material";
import { Layout as DashboardLayout } from "src/layouts/dashboard/layout";
import { PageTitle } from "src/components/page-title";
import { TransactionSidebar } from "src/sections/transactions/transaction-sidebar";
import { useCallback, useMemo, useState } from "react";
import { Transaction, TransactionQuery } from "src/types/transaction/types";
import { moneyFormat, moneyZero } from "src/types/money/methods";
import { useBudgets, useTransactionsSearch } from "src/hooks/use-api";

import PlusIcon from "@heroicons/react/24/solid/PlusIcon";
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

import StarIconOutlined from "@heroicons/react/24/outline/StarIcon";
import StarIconSolid from "@heroicons/react/24/solid/StarIcon";
import { Category } from "src/types/category/types";
import { TransactionList } from "src/sections/transactions/transaction-list";
import { LoadingButton } from "@mui/lab";
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

  const theme = useTheme();
  const mobile = !useMediaQuery(theme.breakpoints.up("sm"));

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
          <IconButton
            sx={{ padding: 0 }}
            onClick={(evt) => {
              starTransaction(row.original, !row.original.starred);
              evt.stopPropagation();
            }}
          >
            <SvgIcon color={row.original.starred ? "primary" : "inherit"} sx={{ fontSize: "0.8em" }}>
              {row.original.starred ? <StarIconSolid /> : <StarIconOutlined />}
            </SvgIcon>
          </IconButton>
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
        meta: { ellipsis: true },
        maxSize: mobile ? 30 : 35,
      },

      // Only show these column on wide displays
      ...(!mobile
        ? ([
            {
              id: "budgetName", // Use "budgetName" instead of "budget" for correct remote sorting
              accessorKey: "budget",
              cell: ({ row }) => getBudget(row, budgets)?.name,
              maxSize: 17.5,
              meta: { ellipsis: true },
            },
            {
              id: "categoryName", // Use "categoryName" instead of "category" for correct remote sorting
              accessorKey: "category",
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
    <Stack spacing={2}>
      <Stack direction="row" alignItems="normal" spacing={0.5}>
        <PageTitle title="Transactions" />
        {budgets && budgets.length > 0 && (
          <Box>
            <IconButton color="inherit" onClick={() => addTransaction(budgets)}>
              <SvgIcon>
                <PlusIcon />
              </SvgIcon>
            </IconButton>
          </Box>
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
      </Stack>

      <Loading error={budgetsError || trxError} loading={false}>
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <TransactionSearch fullWidth search={search} setSearch={setSearch} />
          <TransactionFilterButton filter={filter} setFilter={setFilter} budgets={budgets} />
        </Stack>
        <TransactionFilterChips filter={filter} setFilter={setFilter} budgets={budgets} />
        {count ? <Typography variant="caption">Found {count} transactions</Typography> : null}
        <TransactionList
          table={table}
          setSidebarTrx={(trx) => {
            setSidebarTrx(trx);
            setSidebarOpen(true);
          }}
          isLoading={isLoading}
          isValidating={isValidating}
        />

        {canFetch && (
          <LoadingButton disabled={isValidating} loading={isValidating} fullWidth onClick={fetchMore}>
            Load more
          </LoadingButton>
        )}
      </Loading>
    </Stack>
  );
};

Page.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
