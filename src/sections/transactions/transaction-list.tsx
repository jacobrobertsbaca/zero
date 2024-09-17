import {
  Box,
  IconButton,
  LinearProgress,
  Table as MuiTable,
  Stack,
  styled,
  SvgIcon,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { flexRender, RowData, Table } from "@tanstack/react-table";
import { Transaction } from "src/types/transaction/types";

import UpArrow from "@heroicons/react/20/solid/ArrowUpIcon";
import DownArrow from "@heroicons/react/20/solid/ArrowDownIcon";
import { useEffect, useState } from "react";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    ellipsis?: boolean;
    center?: boolean;
  }
}

const Cell = styled(TableCell)({ paddingLeft: 4, paddingRight: 4 });

const LoadingBar = ({
  colSpan,
  isValidating,
  toleranceMs,
}: {
  colSpan: number;
  isValidating: boolean;
  toleranceMs: number;
}) => {
  const [showBar, setShowBar] = useState(isValidating);
  useEffect(() => {
    if (isValidating) {
      const timeout = setTimeout(() => setShowBar(true), toleranceMs);
      return () => clearTimeout(timeout);
    } else setShowBar(false);
  }, [isValidating, toleranceMs]);

  return (
    <TableRow>
      <TableCell colSpan={colSpan} sx={{ height: 2, padding: 0, borderBottom: "none", borderRadius: 0 }}>
        {showBar && <LinearProgress sx={{ height: 2 }} />}
      </TableCell>
    </TableRow>
  );
};

export type TransactionListProps = {
  table: Table<Transaction>;
  setSidebarTrx: (trx: Transaction) => void;
  isLoading: boolean;
  isValidating: boolean;
};

export const TransactionList = ({ table, setSidebarTrx, isLoading, isValidating }: TransactionListProps) => {
  const { rows } = table.getRowModel();

  return (
    <Box>
      <MuiTable sx={{ whiteSpace: "nowrap", tableLayout: "fixed" }} size="small">
        <TableHead>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <Cell
                  key={header.id}
                  sx={{
                    width: `${(header.getSize() / table.getTotalSize()) * 100}%`,
                    height: 52,
                    py: 1,
                    ...(header.column.getCanSort() ? { cursor: "pointer" } : {}),
                    ...(!header.column.getIsSorted()
                      ? {
                          "@media (hover: hover)": {
                            "&:hover": {
                              "& .button-container": {
                                visibility: "visible",
                                width: "auto",
                              },
                              "& .button-icon": {
                                opacity: 0.5,
                              },
                            },
                          },
                        }
                      : {}),
                  }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <Stack direction="row" alignItems="center">
                    <Typography variant="inherit">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </Typography>
                    {header.column.getCanSort() && (
                      <Box
                        className="button-container"
                        sx={
                          header.column.getIsSorted()
                            ? { visibility: "visible", width: "auto" }
                            : { visibility: "hidden", width: 0 }
                        }
                      >
                        <IconButton sx={{ padding: 0.5 }}>
                          <SvgIcon sx={{ fontSize: "0.7em" }} className="button-icon">
                            {(header.column.getIsSorted() || header.column.getFirstSortDir()) === "asc" ? (
                              <UpArrow />
                            ) : (
                              <DownArrow />
                            )}
                          </SvgIcon>
                        </IconButton>
                      </Box>
                    )}
                  </Stack>
                </Cell>
              ))}
            </TableRow>
          ))}
          <LoadingBar colSpan={table.getVisibleFlatColumns().length} isValidating={isValidating} toleranceMs={1000} />
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover onClick={() => setSidebarTrx(row.original)} sx={{ cursor: "pointer" }}>
              {row.getVisibleCells().map((cell) => (
                <Cell
                  key={cell.id}
                  sx={{
                    width: "auto",
                    ...(cell.column.columnDef.meta?.ellipsis
                      ? { overflow: "hidden", textOverflow: "ellipsis", overflowWrap: "anywhere" }
                      : {}),
                    ...(cell.column.columnDef.meta?.center ? { textAlign: "center" } : {}),
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Cell>
              ))}
            </TableRow>
          ))}
          {!isLoading && rows.length === 0 && (
            <TableRow>
              <Cell colSpan={table.getVisibleFlatColumns().length} sx={{ textAlign: "center", height: 200 }}>
                <Typography variant="caption">No transactions found</Typography>
              </Cell>
            </TableRow>
          )}
        </TableBody>
      </MuiTable>
    </Box>
  );
};
