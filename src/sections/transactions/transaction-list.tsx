import { Box, Table as MuiTable, styled, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { flexRender, RowData, Table } from "@tanstack/react-table";
import { Transaction } from "src/types/transaction/types";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    ellipsis?: boolean;
  }
}

const Cell = styled(TableCell)({ paddingLeft: 4, paddingRight: 4 });

export type TransactionListProps = {
  table: Table<Transaction>;
  setSidebarTrx: (trx: Transaction) => void;
};

export const TransactionList = ({ table, setSidebarTrx }: TransactionListProps) => {
  const { rows } = table.getRowModel();

  return (
    <Box>
      <MuiTable sx={{ whiteSpace: "nowrap", tableLayout: "fixed" }} size="small">
        <TableHead>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <Cell key={header.id} sx={{ width: header.getSize() }}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </Cell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover onClick={() => setSidebarTrx(row.original)} sx={{ cursor: "pointer" }}>
              {row.getVisibleCells().map((cell) => (
                <Cell
                  key={cell.id}
                  sx={{
                    py: 1,
                    ...(cell.column.columnDef.meta?.ellipsis
                      ? { overflow: "hidden", textOverflow: "ellipsis", overflowWrap: "anywhere" }
                      : {}),
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Cell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </MuiTable>
    </Box>
  );
};
