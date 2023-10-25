import { usePaginatedTableContext } from "./paginated-table";

type PaginatedRowsProps<T> = {
  children: (row: T, index: number) => React.ReactNode;
};

export const PaginatedRows = <T,>({ children }: PaginatedRowsProps<T>) => {
  const { page, rowsPerPage, rows } = usePaginatedTableContext<T>();
  return (
    <>{(rowsPerPage > 0 ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : rows).map((r, i) => children(r, i + page * rowsPerPage))}</>
  );
};
