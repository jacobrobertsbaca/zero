import { once } from "lodash";
import { createContext, useContext, useState } from "react";
import { cn } from "src/utils";

export type PaginatedTableContext<T> = {
  readonly rows: T[];
  page: number;
  rowsPerPage: number;
  rowsPerPageOptions: ReturnType<typeof rowsPerPageOptionsToOptions>;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
};

const createPaginatedTableContext = once(<T,>() => createContext({} as PaginatedTableContext<T>));
export const usePaginatedTableContext = <T,>() => useContext(createPaginatedTableContext<T>());

const rowsPerPageOptionDefault = (rowsOptions: number[]) => (rowsOptions ? Math.max(rowsOptions[0], 0) : 0);
const rowsPerPageOptionsToOptions = (rowsOptions: number[]) => {
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

type PaginatedTableProps<T> = React.TableHTMLAttributes<HTMLTableElement> & {
  readonly rows: T[];
  rowsPerPageOptions: number[];
  defaultPage?: number;
  children: React.ReactNode;
};

export const PaginatedTable = <T,>({
  rows,
  rowsPerPageOptions,
  defaultPage,
  children,
  className,
  ...tableProps
}: PaginatedTableProps<T>) => {
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptionDefault(rowsPerPageOptions));
  const [page, setPage] = useState(
    defaultPage ? Math.max(0, Math.min(defaultPage, Math.ceil(rows.length / rowsPerPage))) : 0
  );

  const Context = createPaginatedTableContext<T>();
  return (
    <table className={cn("w-full caption-bottom text-sm", className)} {...tableProps}>
      <Context.Provider
        value={{
          rows,
          page,
          rowsPerPage,
          rowsPerPageOptions: rowsPerPageOptionsToOptions(rowsPerPageOptions),
          onPageChange: setPage,
          onRowsPerPageChange: setRowsPerPage,
        }}
      >
        {children}
      </Context.Provider>
    </table>
  );
};
