import { IconButton, SvgIcon } from "@mui/material";

import { neutral } from "src/theme/colors";

import FilterIcon from "@heroicons/react/24/solid/AdjustmentsHorizontalIcon";

export type TransactionFilterModel = {};

export type TransactionFilterProps = {};

export const TransactionFilterView: React.FC<TransactionFilterProps> = () => {
  return (
    <IconButton
      sx={{
        /** We want the button style to match the MuiFilledInput style so it matches
         * the search bar. These styles are copied from the MuiFilledInput style.
         */
        borderRadius: "8px",
        border: `1px solid ${neutral[200]}`,
      }}
    >
      <SvgIcon>
        <FilterIcon />
      </SvgIcon>
    </IconButton>
  );
};
