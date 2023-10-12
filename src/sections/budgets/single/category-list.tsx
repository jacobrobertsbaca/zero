import {
  Box,
  Card,
  CardHeader,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Scrollbar } from "src/components/scrollbar";
import { Budget, BudgetStatus } from "src/types/budget/types";
import { BudgetViewSelector, BudgetView } from "./budget-view-selector";
import { useState } from "react";
import { categoryActive, categoryActiveIndex, categoryActual, categoryNominal, categoryRollover, categoryTitle } from "src/types/category/methods";
import { SpendingBar } from "../common/spending-bar";
import { Category } from "src/types/category/types";
import { budgetStatus } from "src/types/budget/methods";
import { PeriodTooltip } from "../common/period-tooltip";
import { BudgetSummaryList } from "./budget-summary-list";
import { moneySum } from "src/types/money/methods";

type CategoryRowProps = {
  state: BudgetView;
  category: Category;
  onClick: (category: Category) => void;
};

const CategoryRow = ({ state, category, onClick }: CategoryRowProps) => {
  const activeIndex = categoryActiveIndex(category);
  const activePeriod = category.periods[activeIndex];
  const rollovers = categoryRollover(category);
  const actual = state === BudgetView.Current ? activePeriod!.actual : categoryActual(category);
  const nominal = state === BudgetView.Current ? moneySum(activePeriod!.nominal, rollovers[activeIndex]) : categoryNominal(category);
  return (
    <TableRow hover key={category.id} onClick={() => onClick(category)} sx={{ cursor: "pointer" }}>
      <TableCell>
        <Stack direction="column">
          <Typography variant="subtitle2">{category.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {categoryTitle(category.type)}
          </Typography>
        </Stack>
      </TableCell>
      {state === BudgetView.Current && (
        <TableCell>
          <PeriodTooltip recurrence={category.recurrence.type} dates={activePeriod!.dates} under />
        </TableCell>
      )}
      <TableCell>
        <SpendingBar actual={actual} nominal={nominal} remaining />
      </TableCell>
    </TableRow>
  );
};

type CategoryListProps = {
  budget: Budget;
  onCategoryClicked: (category: Category) => void;
};

export const CategoryList = ({ budget, onCategoryClicked }: CategoryListProps) => {
  const active = budgetStatus(budget) === BudgetStatus.Active;
  const [state, setState] = useState(active ? BudgetView.Current : BudgetView.Total);

  return (
    <Card>
      <CardHeader title="Categories" action={active && <BudgetViewSelector value={state} onChange={setState} />} />
      <Scrollbar>
        <Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: { xs: 100, sm: 200 } }}>Name</TableCell>
                {state === BudgetView.Current && <TableCell sx={{ minWidth: { xs: 100, sm: 200 } }}>Period</TableCell>}
                <TableCell sx={{ width: 0.99 }}>Progress</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {budget.categories.map((category) => (
                <CategoryRow
                  key={category.id}
                  state={state}
                  category={category}
                  onClick={onCategoryClicked}
                />
              ))}
            </TableBody>
            <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} sx={{ borderBottom: "none" }}>
                    <BudgetSummaryList budget={budget} />
                  </TableCell>
                </TableRow>
            </TableFooter>
          </Table>
        </Box>
      </Scrollbar>
    </Card>
  );
};
