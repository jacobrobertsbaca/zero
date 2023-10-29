import { Box } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams, GridValueFormatterParams, GridValueGetterParams } from "@mui/x-data-grid";
import { useBudgets, useTransactions } from "src/hooks/use-api";
import { moneyFormat } from "src/types/money/methods";
import { Money } from "src/types/money/types";
import { asDate } from "src/types/utils/methods";
import { DateString } from "src/types/utils/types";

export const TransactionList = () => {
  const { loading: transactionsLoading, result: transactions } = useTransactions();
  const { loading: budgetsLoading, result: budgets } = useBudgets();

  const cols: GridColDef[] = [
    {
      field: "date",
      headerName: "Date",
      flex: 1,
      maxWidth: 100,
      valueGetter(params: GridValueGetterParams<any, DateString>) {
        if (!params.value) return "";
        return asDate(params.value).toLocaleDateString("en-US");
      },
    },
    {
      field: "amount",
      headerName: "Amount",
      flex: 1,
      maxWidth: 100,
      valueGetter(params: GridValueGetterParams<any, Money>) {
        if (!params.value) return 0;
        return params.value.amount;
      },

      renderCell(params: GridRenderCellParams<any, Money>) {
        if (!params.row.amount) return "";
        return moneyFormat(params.row.amount);
      },
    },
    {
      field: "name",
      headerName: "Name",
      type: "string",
      flex: 1,
    },
    {
      field: "budget",
      headerName: "Budget",
      flex: 1,
      valueGetter(params: GridValueGetterParams<any, string>) {
        if (!params.value || !budgets) return "";
        return budgets.find((b) => b.id === params.value)?.name ?? "";
      },
    },
    {
      field: "category",
      headerName: "Category",
      flex: 1,
      valueGetter(params: GridValueGetterParams<any, string>) {
        if (!params.value || !budgets) return "";
        const budget = budgets.find((b) => b.id === params.row.budget);
        return budget?.categories.find((c) => c.id === params.value)?.name ?? "";
      },
    },
  ];

  return (
    <Box>
      <DataGrid
        loading={transactionsLoading || budgetsLoading}
        rows={transactions ?? []}
        columns={cols}
      />
    </Box>
  );
};
