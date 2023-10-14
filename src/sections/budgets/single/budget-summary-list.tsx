import { Divider, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { Fragment } from "react";
import { MoneyText } from "src/components/money-text";
import { budgetSummary } from "src/types/budget/methods";
import { ActualNominal, Budget } from "src/types/budget/types";
import { categoryTitle } from "src/types/category/methods";
import { RoundingMode } from "src/types/money/methods";

type BudgetSummaryListProps = {
  budget: Budget;
};

type SummaryItem = ActualNominal & { title: string };

export const BudgetSummaryList = ({ budget }: BudgetSummaryListProps) => {
  const { categories, leftovers } = budgetSummary(budget);
  const items: SummaryItem[] = [];
  categories.forEach((c) => items.push({ title: categoryTitle(c.type), actual: c.actual, nominal: c.nominal }));
  if (leftovers) items.push({ title: "Leftovers", actual: leftovers.actual, nominal: leftovers.nominal });

  const theme = useTheme();
  const mobile = !useMediaQuery(theme.breakpoints.up('sm'));

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 0 }} justifyContent="space-between">
      {items.map((item, index) => (
        <Fragment key={item.title}>
          <Stack justifyItems="center">
            <Typography variant="caption" color="text.secondary">
              {item.title}
            </Typography>
            <Typography variant="subtitle2" color="text.primary">
              <MoneyText variant="inherit" amount={item.actual} round={RoundingMode.RoundZero} />
              &nbsp;of&nbsp;
              <MoneyText variant="inherit" amount={item.nominal} round={RoundingMode.RoundZero} />
            </Typography>
          </Stack>
          {index < items.length - 1 && <Divider orientation={mobile ? "horizontal" : "vertical"} flexItem />}
        </Fragment>
      ))}
    </Stack>
  );
};
