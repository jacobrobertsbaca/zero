import { Box, Card, CardHeader, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { Scrollbar } from "src/components/scrollbar";
import { Budget } from "src/types/budget/types";
import { Category, Period } from "src/types/category/types";
import { dateFormat, datesClamp, datesContains } from "src/types/utils/methods";
import { SpendingBar } from "../common/spending-bar";
import { useCallback } from "react";

type PeriodListProps = {
  budget: Budget;
  category: Category;
};

export const PeriodList = ({ budget, category }: PeriodListProps) => {
  const getDates = useCallback(
    (period: Period) => {
      const dates = datesClamp(period.dates, budget.dates);
      const beginDate = dateFormat(dates.begin, { excludeYear: true });
      const endDate = dateFormat(dates.end, { excludeYear: true });
      return `${beginDate} — ${endDate}`;
    },
    [budget]
  );

  return (
    <Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Period</TableCell>
            <TableCell>Progress</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {category.periods.map((period) => (
            <TableRow hover
              key={`${period.dates.begin}${period.dates.end}`}
              // sx={(theme) => ({
              //   ...(datesContains(datesClamp(period.dates, budget.dates), new Date())
              //     ? { backgroundColor: theme.palette.primary.light }
              //     : {}),
              // })}
            >
              <TableCell>{getDates(period)}</TableCell>
              <TableCell>
                <SpendingBar actual={period.actual} nominal={period.nominal} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
