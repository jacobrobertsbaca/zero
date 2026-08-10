import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { debounce } from "lodash";
import { Input } from "src/components/ui/input";
import { cn } from "src/utils";

export type TransactionSearchProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  search: string | undefined;
  setSearch: (search: string | undefined) => void;
  debounceMs?: number;
  fullWidth?: boolean;
};

export const TransactionSearch = ({
  search,
  setSearch,
  debounceMs = 300,
  fullWidth,
  className,
  ...rest
}: TransactionSearchProps) => {
  const [bufferedSearch, setBufferedSearch] = useState(search ?? "");

  const onSearchDebounced = useMemo(
    () => debounce((search: string) => setSearch(search.length > 0 ? search : undefined), debounceMs),
    [debounceMs, setSearch]
  );

  /** Since this component is controlled, we need to sync the `search` prop with the input if it changes.
   * When we receive a change to the controlled prop, we will wait some time before changing the input.
   * This prevents some jitteriness with user input/controlled input competing with each other.
   * However, if we receive a new input, we must cancel any pending syncs to prevent us from going back
   * to a previously entered input (see below).
   */
  const onSyncDebounced = useMemo(() => debounce((search) => setBufferedSearch(search), debounceMs + 50), [debounceMs]);
  useEffect(() => {
    onSyncDebounced(search ?? "");
  }, [search, onSyncDebounced]);

  return (
    <div className={cn("relative", fullWidth && "w-full", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search..."
        value={bufferedSearch}
        onChange={(e) => {
          setBufferedSearch(e.target.value);
          onSearchDebounced(e.target.value);
          onSyncDebounced.cancel();
        }}
        className="bg-muted/40 pl-9"
        {...rest}
      />
    </div>
  );
};
