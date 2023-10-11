import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Category, Period } from "src/types/category/types";
import { dateFormat, datesContains } from "src/types/utils/methods";
import { SpendingBar } from "../common/spending-bar";
import { useCallback } from "react";

type PeriodListProps = {
  category: Category;
};

export const PeriodList = ({ category }: PeriodListProps) => {
  const getDates = useCallback((period: Period) => 
  {
    const beginDate = dateFormat(period.dates.begin, { excludeYear: true });
    if (period.dates.begin === period.dates.end) return beginDate;
    const endDate = dateFormat(period.dates.end, { excludeYear: true });
    return `${beginDate} — ${endDate}`;
  }, []);

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
          {category.periods.map((period, index) =>
            index === 0 && period.nominal.amount === 0 ? null :
            index === category.periods.length - 1 && period.nominal.amount === 0 ? null :
            (
              <TableRow hover key={`${period.dates.begin}${period.dates.end}`}>
                <TableCell>
                  <Stack>
                    {index === 0 ? "Earlier" : index === category.periods.length - 1 ? "Later" : getDates(period)}
                    {datesContains(period.dates, new Date()) && (
                      <Typography variant="caption" color="text.secondary">
                        Current
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  <SpendingBar actual={period.actual} nominal={period.nominal} />
                </TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </Box>
  );
};
