import { CreditCard } from "lucide-react";
import { Category, Period } from "src/types/category/types";

import { useMemo } from "react";
import { emptyFilters, encodeFilterModel } from "./transaction-filter";
import { dateMax, dateMin } from "src/types/utils/methods";
import { Button } from "src/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "src/components/ui/tooltip";

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
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="size-6" asChild>
            <a href={path} target="_blank" rel="noreferrer">
              <CreditCard className="size-3.5" />
              <span className="sr-only">View transactions</span>
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">View transactions</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
