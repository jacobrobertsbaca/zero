import { Box, IconButton, SvgIcon, TablePagination, TablePaginationProps, useTheme } from "@mui/material";
import { usePaginatedTableContext } from "./paginated-table";

type PaginatedOptionsProps = Omit<
  TablePaginationProps,
  "rowsPerPageOptions" | "count" | "rowsPerPage" | "page" | "onPageChange" | "onRowsPerPageChange"
>;

export const PaginatedOptions = ({ ...paginationProps }: PaginatedOptionsProps) => {
  const { rows, page, onPageChange, rowsPerPage, onRowsPerPageChange, rowsPerPageOptions } = usePaginatedTableContext();

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
    onPageChange(0);
  };

  if (rowsPerPageOptions.every(v => (typeof v === "number" ? v : 0) > rows.length)) return null;

  const numPages = Math.ceil(rows.length / rowsPerPage);
  const showFirstLast = numPages > 2;

  return (
    <TablePagination
      rowsPerPageOptions={rowsPerPageOptions}
      count={rows.length}
      rowsPerPage={rowsPerPage}
      page={page}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      showFirstButton={showFirstLast}
      showLastButton={showFirstLast}
      {...paginationProps}
    />
  );
};
