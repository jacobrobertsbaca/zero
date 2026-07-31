import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "src/components/ui/button";
import { usePaginatedTableContext } from "./paginated-table";

export const PaginatedOptions = () => {
  const { rows, page, onPageChange, rowsPerPage, onRowsPerPageChange, rowsPerPageOptions } = usePaginatedTableContext();

  if (rowsPerPageOptions.every((v) => (typeof v === "number" ? v : 0) > rows.length)) return null;

  const numPages = Math.max(1, Math.ceil(rows.length / (rowsPerPage || rows.length || 1)));
  const showFirstLast = numPages > 2;
  const from = rows.length === 0 ? 0 : page * (rowsPerPage || rows.length) + 1;
  const to = rowsPerPage === 0 ? rows.length : Math.min(rows.length, (page + 1) * rowsPerPage);

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 px-1 py-2 text-xs text-muted-foreground">
      {rowsPerPageOptions.length > 1 && (
        <label className="flex items-center gap-2">
          Rows
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            value={rowsPerPage}
            onChange={(e) => {
              onRowsPerPageChange(parseInt(e.target.value, 10));
              onPageChange(0);
            }}
          >
            {rowsPerPageOptions.map((opt) => {
              const value = typeof opt === "number" ? opt : opt.value;
              const label = typeof opt === "number" ? String(opt) : opt.label;
              return (
                <option key={String(value)} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
        </label>
      )}
      <span>
        {from}–{to} of {rows.length}
      </span>
      <div className="flex items-center gap-0.5">
        {showFirstLast && (
          <Button type="button" variant="ghost" size="icon" className="size-7" disabled={page === 0} onClick={() => onPageChange(0)}>
            <ChevronFirst className="size-3.5" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={page >= numPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-3.5" />
        </Button>
        {showFirstLast && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={page >= numPages - 1}
            onClick={() => onPageChange(numPages - 1)}
          >
            <ChevronLast className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};
