import { InputAdornment, SvgIcon, TextField, TextFieldProps } from "@mui/material";

import SearchIcon from "@heroicons/react/20/solid/MagnifyingGlassIcon";
import { useEffect, useMemo, useState } from "react";
import { debounce } from "lodash";

export type TransactionSearchProps = TextFieldProps & {
  search: string | undefined;
  setSearch: (search: string | undefined) => void;
  debounceMs?: number;
};

export const TransactionSearch = ({ search, setSearch, debounceMs = 300, ...rest }: TransactionSearchProps) => {
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
    <TextField
      placeholder="Search..."
      value={bufferedSearch}
      onChange={(e) => {
        setBufferedSearch(e.target.value);
        onSearchDebounced(e.target.value);
        onSyncDebounced.cancel();
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SvgIcon fontSize="small">
              <SearchIcon />
            </SvgIcon>
          </InputAdornment>
        ),
      }}
      variant="filled"
      hiddenLabel
      size="small"
      {...rest}
    />
  );
};
