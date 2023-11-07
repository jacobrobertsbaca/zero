import { Box, CircularProgress, Stack, SvgIcon, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
  GridValueGetterParams,
} from "@mui/x-data-grid";
import Link from "next/link";
import { Budget } from "src/types/budget/types";
import { moneyFormat } from "src/types/money/methods";
import { Money } from "src/types/money/types";
import { Transaction } from "src/types/transaction/types";
import { asDate } from "src/types/utils/methods";
import { DateString } from "src/types/utils/types";

import PlusIcon from "@heroicons/react/24/solid/PlusIcon";
import StarIconOutlined from "@heroicons/react/24/outline/StarIcon";
import StarIconSolid from "@heroicons/react/24/solid/StarIcon";
import { useSnackbar } from "notistack";
import { useCallback } from "react";

/* ================================================================================================================= *
 * Overlays                                                                                                          *
 * ================================================================================================================= */

const NoTransactionsOverlay = ({ mode }: { mode: "add" | "budgets" | "loading" }) => (
  <Stack alignItems="center" justifyContent="center" height={1}>
    {mode === "add" && (
      <Stack alignItems="center" direction="row">
        Click&nbsp;
        <SvgIcon sx={{ display: "inline" }}>
          <PlusIcon />
        </SvgIcon>
        &nbsp;to add a transaction
      </Stack>
    )}
    {mode === "budgets" && (
      <Stack alignItems="center" direction="row">
        <Link href="/budgets">Create a budget</Link>&nbsp;to add a transaction!
      </Stack>
    )}
    {mode === "loading" && <CircularProgress size={24} />}
  </Stack>
);

/* ================================================================================================================= *
 * Transaction List                                                                                                  *
 * ================================================================================================================= */

type TransactionListProps = {
  transactions?: readonly Transaction[];
  budgets: readonly Budget[];
  loading: boolean;
  onTrxSelected: (trx: Transaction) => void;
  onTrxStarred: (trx: Transaction, star: boolean) => void;
};

export const TransactionList = ({ loading, transactions, budgets, onTrxSelected, onTrxStarred }: TransactionListProps) => {
  const theme = useTheme();
  const mobile = !useMediaQuery(theme.breakpoints.up("sm"));

  const cols: GridColDef[] = [
    {
      field: "actions",
      type: "actions",
      width: 48,
      getActions(params: GridRowParams<Transaction>) {
        if (params.row.starred)
          return [
            <GridActionsCellItem
              key="unstar"
              label="Unstar transaction"
              icon={
                <Tooltip title="Unstar transaction">
                  <SvgIcon>
                    <StarIconSolid />
                  </SvgIcon>
                </Tooltip>
              }
              onClick={() => onTrxStarred(params.row, false)}
            />,
          ];
        return [
          <GridActionsCellItem
            key="star"
            label="Star transaction"
            icon={
              <Tooltip title="Star transaction">
                <SvgIcon>
                  <StarIconOutlined />
                </SvgIcon>
              </Tooltip>
            }
            onClick={() => onTrxStarred(params.row, true)}
          />,
        ];
      },
    },
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
        rows={loading ? [] : transactions ?? []}
        columns={cols}
        disableColumnMenu
        onRowClick={(params: GridRowParams<Transaction>) => onTrxSelected(params.row)}
        slots={{
          noRowsOverlay: NoTransactionsOverlay,
        }}
        slotProps={{
          noRowsOverlay: { mode: loading ? "loading" : budgets.length > 0 ? "add" : "budgets" } as any,
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
