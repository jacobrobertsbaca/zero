import { Link, Stack, Tooltip, Typography } from "@mui/material";
import { RecurrenceType } from "src/types/category/types";
import { dateFormat } from "src/types/utils/methods";
import { Dates } from "src/types/utils/types";

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
      <Stack>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography variant="caption" color="text.secondary">{activeDates}</Typography>
      </Stack>
    );

  return (
    <Tooltip
      title={activeDates}
      enterTouchDelay={0}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      placement="top"
      arrow
    >
      <Link color="inherit" underline="hover" onTouchStart={(event) => event.stopPropagation()}>
        {title}
      </Link>
    </Tooltip>
  );
};
