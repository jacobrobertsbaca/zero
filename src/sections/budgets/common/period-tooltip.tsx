import { Link, Tooltip } from "@mui/material";
import { RecurrenceType } from "src/types/category/types";
import { dateFormat } from "src/types/utils/methods";
import { Dates } from "src/types/utils/types";

export const PeriodTooltip = ({ recurrence, dates }: { recurrence: RecurrenceType; dates: Dates }) => {
  const title = {
    [RecurrenceType.None]: "Overall",
    [RecurrenceType.Monthly]: "This Month",
    [RecurrenceType.Weekly]: "This Week",
  }[recurrence];

  const beginDate = dateFormat(dates.begin, { excludeYear: true });
  const endDate = dateFormat(dates.end, { excludeYear: true });
  const activeDates = `${beginDate} — ${endDate}`;

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
