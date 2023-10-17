import {
  Box,
  Card,
  CardHeader,
  Stack,
  SvgIcon,
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
import { useCallback, useState } from "react";
import {
  categoryActive,
  categoryActiveIndex,
  categoryActual,
  categoryDefault,
  categoryNominal,
  categoryRollover,
  categoryTitle,
} from "src/types/category/methods";
import { SpendingBar } from "../common/spending-bar";
import { Category } from "src/types/category/types";
import { budgetStatus } from "src/types/budget/methods";
import { PeriodTooltip } from "../common/period-tooltip";
import { BudgetSummaryList } from "./budget-summary-list";
import { moneySum } from "src/types/money/methods";

import PlusIcon from "@heroicons/react/24/solid/PlusIcon";

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
  const nominal =
    state === BudgetView.Current ? moneySum(activePeriod!.nominal, rollovers[activeIndex]) : categoryNominal(category);

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
    <Stack>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h6">Categories</Typography>
        {active && <BudgetViewSelector value={state} onChange={setState} />}
      </Stack>
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
          <TableRow hover sx={{ cursor: "pointer" }} onClick={() => onCategoryClicked(categoryDefault(budget))}>
            <TableCell colSpan={3} align="center">
              <SvgIcon color="disabled">
                <PlusIcon />
              </SvgIcon>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Stack>
  );
};
