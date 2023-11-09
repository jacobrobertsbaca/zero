import { Table, TableProps } from "@mui/material";
import { once } from "lodash";
import { createContext, useContext, useState } from "react";

export type PaginatedTableContext<T> = {
  readonly rows: T[];
  page: number;
  rowsPerPage: number;
  rowsPerPageOptions: ReturnType<typeof rowsPerPageOptionsToMuiOptions>;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
};

const createPaginatedTableContext = once(<T,>() => createContext({} as PaginatedTableContext<T>));
export const usePaginatedTableContext = <T,>() => useContext(createPaginatedTableContext<T>());

const rowsPerPageOptionDefault = (rowsOptions: number[]) => (rowsOptions ? Math.max(rowsOptions[0], 0) : 0);
const rowsPerPageOptionsToMuiOptions = (rowsOptions: number[]) => {
  // Sort rows so that non-positive elements are last.
  rowsOptions = [...rowsOptions];
  return rowsOptions
    .sort((a, b) => {
      if (a <= 0 && b <= 0) return 0;
      if (a <= 0 && b > 0) return 1;
      if (a > 0 && b <= 0) return -1;
      return a - b;
    })
    .map((r) => (r > 0 ? r : { value: 0, label: "All" }));
};

type PaginatedTableProps<T> = TableProps & {
  readonly rows: T[];

  /**
   * Options for number of rows to show per page.
   * These will be sorted before being shown, with the first value corresponding to the default option.
   * Non-positive numbers correspond to an "All" option which displays all rows.
   */
  rowsPerPageOptions: number[];

  defaultPage?: number;

  children: React.ReactNode;
};

export const PaginatedTable = <T,>({
  rows,
  rowsPerPageOptions,
  defaultPage,
  children,
  ...tableProps
}: PaginatedTableProps<T>) => {
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptionDefault(rowsPerPageOptions));
  const [page, setPage] = useState(
    defaultPage ? Math.max(0, Math.min(defaultPage, Math.ceil(rows.length / rowsPerPage))) : 0
  );

  const Context = createPaginatedTableContext<T>();
  return (
    <Table {...tableProps}>
      <Context.Provider
        value={{
          rows,
          page,
          rowsPerPage,
          rowsPerPageOptions: rowsPerPageOptionsToMuiOptions(rowsPerPageOptions),
          onPageChange: setPage,
          onRowsPerPageChange: setRowsPerPage,
        }}
      >
        {children}
      </Context.Provider>
    </Table>
  );
};
