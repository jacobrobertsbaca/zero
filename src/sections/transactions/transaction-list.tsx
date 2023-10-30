import PlusIcon from "@heroicons/react/24/solid/PlusIcon";
import { Box, Stack, SvgIcon, useMediaQuery, useTheme } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams, GridRowParams, GridValueGetterParams } from "@mui/x-data-grid";
import Link from "next/link";
import { Budget } from "src/types/budget/types";
import { moneyFormat } from "src/types/money/methods";
import { Money } from "src/types/money/types";
import { Transaction } from "src/types/transaction/types";
import { asDate } from "src/types/utils/methods";
import { DateString } from "src/types/utils/types";

/* ================================================================================================================= *
 * Overlays                                                                                                          *
 * ================================================================================================================= */

const NoTransactionsOverlay = ({ allowAdd }: { allowAdd: boolean }) => (
  <Stack alignItems="center" justifyContent="center" height={1}>
    {allowAdd && (
      <Stack alignItems="center" direction="row">
        Click&nbsp;
        <SvgIcon sx={{ display: "inline" }}>
          <PlusIcon />
        </SvgIcon>
        &nbsp;to add a transaction
      </Stack>
    )}
    {!allowAdd && (
      <Stack alignItems="center" direction="row">
        You must&nbsp;<Link href="/budgets">create a budget</Link>&nbsp;before you can add a transaction!
      </Stack>
    )}
  </Stack>
);

/* ================================================================================================================= *
 * Transaction List                                                                                                  *
 * ================================================================================================================= */

type TransactionListProps = {
  transactions: readonly Transaction[];
  budgets: readonly Budget[];
  onTrxSelected: (trx: Transaction) => void;
};

export const TransactionList = ({ transactions, budgets, onTrxSelected }: TransactionListProps) => {
  const theme = useTheme();
  const mobile = !useMediaQuery(theme.breakpoints.up("sm"));

  const cols: GridColDef[] = [
    {
      field: "date",
      headerName: "Date",
      flex: 1,
      maxWidth: 100,
      renderCell(params: GridRenderCellParams<any, DateString>) {
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

    // Only show these columns when not on a mobile display
    ...(!mobile
      ? [
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
        ]
      : []),
  ];

  return (
    <Box>
      <DataGrid
        autoHeight
        rows={transactions}
        columns={cols}
        disableColumnMenu
        onRowClick={(params: GridRowParams<Transaction>) => onTrxSelected(params.row)}
        slots={{
          noRowsOverlay: NoTransactionsOverlay,
        }}
        slotProps={{
          noRowsOverlay: { allowAdd: budgets.length > 0 } as any,
        }}
        sx={{
          // disable cell selection style
          ".MuiDataGrid-cell:focus": {
            outline: "none",
          },
          // pointer cursor on ALL rows
          "& .MuiDataGrid-row:hover": {
            cursor: "pointer",
          },
          // overlay height
          "--DataGrid-overlayHeight": "300px",
        }}
      />
    </Box>
  );
};
