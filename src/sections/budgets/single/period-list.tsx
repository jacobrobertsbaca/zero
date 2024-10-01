import { Stack, TableBody, TableCell, TableFooter, TableHead, TableRow, Typography } from "@mui/material";
import { Category, Period, RecurrenceType } from "src/types/category/types";
import { SpendingBar } from "../common/spending-bar";
import { categoryActiveIndex, categoryRollover, periodDatesFormat } from "src/types/category/methods";
import { MoneyText } from "src/components/money-text";
import { moneySum, RoundingMode } from "src/types/money/methods";
import { PaginatedTable } from "src/components/table/paginated-table";
import { PaginatedRows } from "src/components/table/paginated-rows";
import { PaginatedOptions } from "src/components/table/paginated-options";
import { TransactionsLink } from "src/sections/transactions/transactions-link";

type PeriodListProps = {
  category: Category;
};

export const PeriodList = ({ category }: PeriodListProps) => {
  const includeEarlier = category.periods[0].actual.amount !== 0;
  const includeLater = category.periods[category.periods.length - 1].actual.amount !== 0;

  /* Hide period list if recurrence is none and no earlier/later periods */
  if (category.recurrence.type === RecurrenceType.None && !includeEarlier && !includeLater) return null;

  const activeIndex = categoryActiveIndex(category) - (includeEarlier ? 0 : 1);
  const rollovers = categoryRollover(category).filter((p, i) => {
    if (i === 0) return includeEarlier;
    if (i === category.periods.length - 1) return includeLater;
    return true;
  });

  const rows = category.periods.filter((p, i) => {
    if (i === 0) return includeEarlier;
    if (i === category.periods.length - 1) return includeLater;
    return true;
  });

  const isCurrent = (index: number) => {
    if (includeEarlier && index === 0) return false;
    if (includeLater && index === rows.length - 1) return false;
    return index === activeIndex;
  };

  let defaultPage = activeIndex < rows.length ? Math.floor(activeIndex / 10) : 0;
  if (includeLater && activeIndex === rows.length - 1) defaultPage = 0;

  return (
    <PaginatedTable rows={rows} rowsPerPageOptions={[10]} defaultPage={defaultPage}>
      <TableHead>
        <TableRow>
          <TableCell>Period</TableCell>
          <TableCell width="40%">Progress</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <PaginatedRows>
          {(period: Period, index: number) => (
            <TableRow hover key={`${period.dates.begin}${period.dates.end}`}>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TransactionsLink category={category} period={period} />
                  <Stack>
                    {index === 0 && includeEarlier
                      ? "Earlier"
                      : index === rows.length - 1 && includeLater
                      ? "Later"
                      : periodDatesFormat(period)}
                    {isCurrent(index) && (
                      <Typography variant="caption" color="text.secondary">
                        Current
                      </Typography>
                    )}
                  </Stack>
                </Stack>
              </TableCell>
              <TableCell>
                <SpendingBar
                  actual={period.actual}
                  nominal={moneySum(period.nominal, rollovers[index])}
                  remaining={
                    rollovers[index].amount !== 0 && (
                      <MoneyText
                        variant="caption"
                        fontWeight={700}
                        amount={rollovers[index]}
                        plus
                        status
                        round={RoundingMode.RoundZero}
                      />
                    )
                  }
                />
              </TableCell>
            </TableRow>
          )}
        </PaginatedRows>
      </TableBody>
      <TableFooter>
        <TableRow>
          <PaginatedOptions colSpan={2} />
        </TableRow>
      </TableFooter>
    </PaginatedTable>
  );
};
