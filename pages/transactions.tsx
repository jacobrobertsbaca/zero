import { Box, IconButton, Stack, SvgIcon } from "@mui/material";
import { Layout as DashboardLayout } from "src/layouts/dashboard/layout";
import { PageTitle } from "src/components/page-title";
import { TransactionList } from "src/sections/transactions/transaction-list";
import { TransactionSidebar } from "src/sections/transactions/transaction-sidebar";
import { useCallback, useState } from "react";
import { Transaction } from "src/types/transaction/types";
import { moneyZero } from "src/types/money/methods";
import { useBudgets, useTransactions } from "src/hooks/use-api";
import { Loading } from "src/components/loading";

import PlusIcon from "@heroicons/react/24/solid/PlusIcon";
import { Budget } from "src/types/budget/types";
import { asDateString } from "src/types/utils/methods";
import { Money } from "src/types/money/types";

const Page = () => {
  const { loading, result } = useBudgets();
  const { loading: transactionsLoading, result: transactions, refresh: refreshTransactions } = useTransactions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTrx, setSidebarTrx] = useState<Transaction>({
    id: "",
    budget: "",
    category: "",
    date: "",
    amount: moneyZero(),
    name: "",
  });

  const onAddTrx = useCallback((budgets: readonly Budget[]) => {
    setSidebarTrx({
      id: "",
      budget: budgets[0].id, // 1st budget should be active, assumes budgets in sorted order
      category: "",
      date: asDateString(new Date()), // Today
      amount: null as unknown as Money,   // Setting to null default MoneyField to empty value
      name: "",
    });
    setSidebarOpen(true);
  }, []);

  return (
    <Loading value={result}>
      {(budgets) => (
        <>
          <TransactionSidebar
            budgets={budgets}
            transaction={sidebarTrx}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onUpdate={(trx) => {
              refreshTransactions();
              setSidebarOpen(false);
            }}
            onDelete={() => {
              refreshTransactions();
              setSidebarOpen(false);
            }}
          />
          <Stack direction="row" alignItems="normal" spacing={0.5}>
            <PageTitle title="Transactions" />
            <Box>
              <IconButton color="inherit" onClick={() => onAddTrx(budgets)}>
                <SvgIcon>
                  <PlusIcon />
                </SvgIcon>
              </IconButton>
            </Box>
          </Stack>
          <TransactionList
            transactions={transactions ?? []}
            budgets={budgets}
            onTrxSelected={(trx) => {
              setSidebarTrx(trx);
              setSidebarOpen(true);
            }}
          />
        </>
      )}
    </Loading>
  );
};

Page.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
