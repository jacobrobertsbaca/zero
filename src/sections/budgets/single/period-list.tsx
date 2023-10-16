import { Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { Category, Period } from "src/types/category/types";
import { SpendingBar } from "../common/spending-bar";
import { categoryActiveIndex, categoryRollover, periodDatesFormat } from "src/types/category/methods";
import { MoneyText } from "src/components/money-text";
import { moneySum, RoundingMode } from "src/types/money/methods";

type PeriodListProps = {
  category: Category;
};

export const PeriodList = ({ category }: PeriodListProps) => {
  const activeIndex = categoryActiveIndex(category);
  const rollovers = categoryRollover(category);

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Period</TableCell>
          <TableCell>Progress</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {category.periods.map((period: Period, index: number) =>
          index === 0 && period.actual.amount === 0 ? null : index === category.periods.length - 1 &&
            period.actual.amount === 0 ? null : (
            <TableRow hover key={`${period.dates.begin}${period.dates.end}`}>
              <TableCell>
                <Stack>
                  {index === 0
                    ? "Earlier"
                    : index === category.periods.length - 1
                    ? "Later"
                    : periodDatesFormat(period)}
                  {index > 0 && index < category.periods.length - 1 && index === activeIndex && (
                    <Typography variant="caption" color="text.secondary">
                      Current
                    </Typography>
                  )}
                </Stack>
              </TableCell>
              <TableCell>
                <SpendingBar
                  actual={period.actual}
                  nominal={moneySum(period.nominal, rollovers[index])}
                  remaining={
                    index >= activeIndex &&
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
          )
        )}
      </TableBody>
    </Table>
  );
};
