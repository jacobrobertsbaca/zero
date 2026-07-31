import { RecurrenceType } from "src/types/category/types";
import { dateFormat } from "src/types/utils/methods";
import { Dates } from "src/types/utils/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "src/components/ui/tooltip";

type PeriodTooltipProps = {
  recurrence: RecurrenceType;
  dates: Dates;
  under?: boolean;
};

export const PeriodTooltip = ({ recurrence, dates, under }: PeriodTooltipProps) => {
  const title = {
    [RecurrenceType.None]: "Overall",
    [RecurrenceType.Monthly]: "This Month",
    [RecurrenceType.Weekly]: "This Week",
  }[recurrence];

  const beginDate = dateFormat(dates.begin, { excludeYear: true });
  const endDate = dateFormat(dates.end, { excludeYear: true });
  const activeDates = `${beginDate} — ${endDate}`;

  if (under)
    return (
      <div className="flex flex-col">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{activeDates}</span>
      </div>
    );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="text-sm font-medium underline-offset-4 hover:underline"
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
          >
            {title}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">{activeDates}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
