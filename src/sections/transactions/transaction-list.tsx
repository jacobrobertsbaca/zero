import { flexRender, RowData, Table } from "@tanstack/react-table";
import { Transaction } from "src/types/transaction/types";

import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "src/utils";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    ellipsis?: boolean;
    center?: boolean;
  }
}

export type TransactionListProps = {
  table: Table<Transaction>;
  setSidebarTrx: (trx: Transaction) => void;
  isLoading: boolean;
};

export const TransactionList = ({ table, setSidebarTrx, isLoading }: TransactionListProps) => {
  const { rows } = table.getRowModel();

  return (
    <table className="w-full table-fixed whitespace-nowrap text-sm">
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id} className="border-b text-left text-xs text-muted-foreground">
            {group.headers.map((header) => (
              <th
                key={header.id}
                style={{ width: `${(header.getSize() / table.getTotalSize()) * 100}%` }}
                className={cn(
                  "group px-2 py-2 align-middle font-medium",
                  header.column.getCanSort() && "cursor-pointer",
                  header.column.columnDef.meta?.center && "text-center"
                )}
                onClick={header.column.getToggleSortingHandler()}
              >
                <div
                  className={cn(
                    "flex items-center",
                    header.column.columnDef.meta?.center && "justify-center"
                  )}
                >
                  <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                  {header.column.getCanSort() && (
                    <span
                      className={cn(
                        "ml-0.5 inline-flex items-center",
                        header.column.getIsSorted() ? "visible" : "invisible group-hover:visible"
                      )}
                    >
                      {(header.column.getIsSorted() || header.column.getFirstSortDir()) === "asc" ? (
                        <ArrowUp className="size-3 opacity-50" />
                      ) : (
                        <ArrowDown className="size-3 opacity-50" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.id}
            role="button"
            tabIndex={0}
            onClick={() => setSidebarTrx(row.original)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSidebarTrx(row.original);
              }
            }}
            className="cursor-pointer rounded-md border-b last:border-b-0 hover:bg-muted/40 focus-visible:bg-muted/40"
          >
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className={cn(
                  "px-1 py-2 align-middle",
                  cell.column.columnDef.meta?.ellipsis && "overflow-hidden text-ellipsis [overflow-wrap:anywhere]",
                  cell.column.columnDef.meta?.center && "text-center"
                )}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
        {!isLoading && rows.length === 0 && (
          <tr>
            <td colSpan={table.getVisibleFlatColumns().length} className="h-[200px] text-center">
              <span className="text-xs text-muted-foreground">No transactions found</span>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};
