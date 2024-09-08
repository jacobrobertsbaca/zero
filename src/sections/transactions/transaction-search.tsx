import { InputAdornment, SvgIcon, TextField } from "@mui/material";

import SearchIcon from "@heroicons/react/20/solid/MagnifyingGlassIcon";
import { useMemo, useState } from "react";
import { debounce } from "lodash";

export type TransactionSearchProps = {
  onSearch: (search: string | undefined) => void;
};

export const TransactionSearch = ({ onSearch }: TransactionSearchProps) => {
  const [bufferedSearch, setBufferedSearch] = useState("");
  const onSearchDebounced = useMemo(
    () => debounce((search: string) => onSearch(search.length > 0 ? search : undefined), 200),
    [onSearch]
  );

  return (
    <TextField
      placeholder="Search..."
      value={bufferedSearch}
      onChange={(e) => {
        setBufferedSearch(e.target.value);
        onSearchDebounced(e.target.value);
      }}
      variant="standard"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SvgIcon fontSize="small">
              <SearchIcon />
            </SvgIcon>
          </InputAdornment>
        ),
      }}
    />
  );
};
