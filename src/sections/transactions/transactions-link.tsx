import { IconButton, SvgIcon, Tooltip } from "@mui/material";
import { Category, Period } from "src/types/category/types";

import LinkIcon from "@heroicons/react/24/outline/CreditCardIcon";
import { useMemo } from "react";
import { emptyFilters, encodeFilterModel } from "./transaction-filter";
import { dateMax, dateMin } from "src/types/utils/methods";

export type TransactionsLinkProps = {
  category?: Category;
  period?: Period;
};

export const TransactionsLink = ({ category, period }: TransactionsLinkProps) => {
  const path = useMemo(() => {
    const filter = emptyFilters();
    if (category) filter.category = [category.id];
    if (period) {
      if (period.dates.begin !== dateMin()) filter.dateMin = period.dates.begin;
      if (period.dates.end !== dateMax()) filter.dateMax = period.dates.end;
    }

    const params = new URLSearchParams();
    encodeFilterModel(filter, params);
    return `/transactions?${params.toString()}`;
  }, [category, period]);

  return (
    <Tooltip title="View transactions" placement="left" arrow>
      <IconButton href={path} target="_blank" size="small">
        <SvgIcon sx={{ fontSize: "1em" }}>
          <LinkIcon />
        </SvgIcon>
      </IconButton>
    </Tooltip>
  );
};
