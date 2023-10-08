import { Divider, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { budgetSummary } from "src/types/budget/methods";
import { ActualNominal, Budget } from "src/types/budget/types";
import { categoryTitle } from "src/types/category/methods";
import { moneyFormat } from "src/types/money/methods";

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
        <>
          <Stack justifyItems="center">
            <Typography variant="caption" color="text.secondary">
              {item.title}
            </Typography>
            <Typography variant="subtitle2" color="text.primary">
              {moneyFormat(item.actual, true)} of {moneyFormat(item.nominal, true)}
            </Typography>
          </Stack>
          {index < items.length - 1 && <Divider orientation={mobile ? "horizontal" : "vertical"} flexItem />}
        </>
      ))}
    </Stack>
  );
};
