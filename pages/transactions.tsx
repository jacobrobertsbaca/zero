import { Box, IconButton, Stack, SvgIcon } from "@mui/material";
import { Layout as DashboardLayout } from "src/layouts/dashboard/layout";
import { PageTitle } from "src/components/page-title";
import { TransactionList } from "src/sections/transactions/transaction-list";
import { TransactionSidebar } from "src/sections/transactions/transaction-sidebar";
import { useCallback, useState } from "react";
import { Transaction } from "src/types/transaction/types";
import { moneyZero } from "src/types/money/methods";
import { useBudgets, useTransactionsSearch } from "src/hooks/use-api";
import { Loading } from "src/components/loading";

import PlusIcon from "@heroicons/react/24/solid/PlusIcon";
import { Budget } from "src/types/budget/types";
import { asDateString } from "src/types/utils/methods";
import { Money } from "src/types/money/types";

const Page = () => {
  const { budgets, error: budgetsError } = useBudgets();
  const {
    transactions,
    error: trxError,
    putTransaction,
    deleteTransaction,
    starTransaction,
    fetchMore,
    isValidating
  } = useTransactionsSearch({});

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

  return (
    <>
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
      <Loading error={trxError || budgetsError} value={transactions}>
        {(transactions) => (
          <TransactionList
            transactions={transactions}
            fetchMore={fetchMore}
            isValidating={isValidating}
            budgets={budgets ?? []}
            onTrxSelected={(trx) => {
              setSidebarTrx(trx);
              setSidebarOpen(true);
            }}
            onTrxStarred={starTransaction}
          />
        )}
      </Loading>
    </>
  );
};

Page.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
