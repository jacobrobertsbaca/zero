import PropTypes from "prop-types";
import { format } from "date-fns";
import {
  Avatar,
  Box,
  Card,
  CardHeader,
  Checkbox,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import { Scrollbar } from "src/components/scrollbar";
import { getInitials } from "src/utils/get-initials";
import { Budget, BudgetStatus } from "src/types/budget/types";
import { BudgetSummarySelector, BudgetSummaryState } from "../overview/budget-summary-selector";
import { useState } from "react";
import { categoryActive, categoryActual, categoryNominal, categoryTitle } from "src/types/category/methods";
import { SpendingBar } from "../common/spending-bar";
import { Category } from "src/types/category/types";
import { budgetStatus } from "src/types/budget/methods";
import { PeriodTooltip } from "../common/period-tooltip";

type CategoryRowProps = {
  state: BudgetSummaryState;
  budget: Budget;
  category: Category;
  onClick: (category: Category) => void;
};

const CategoryRow = ({ state, budget, category, onClick }: CategoryRowProps) => {
  const activePeriod = categoryActive(category);
  const actual = state === BudgetSummaryState.Current ? activePeriod!.actual : categoryActual(category);
  const nominal = state === BudgetSummaryState.Current ? activePeriod!.nominal : categoryNominal(category);
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
      {state === BudgetSummaryState.Current && (
        <TableCell>
          <PeriodTooltip recurrence={category.recurrence.type} dates={activePeriod!.dates} budget={budget} under />
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
  const [state, setState] = useState(active ? BudgetSummaryState.Current : BudgetSummaryState.Total);

  return (
    <Card>
      <CardHeader title="Categories" action={active && <BudgetSummarySelector value={state} onChange={setState} />} />
      <Scrollbar>
        <Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: { xs: 100, sm: 200 } }}>Name</TableCell>
                {state === BudgetSummaryState.Current && <TableCell sx={{ minWidth: { xs: 100, sm: 200 } }}>Period</TableCell>}
                <TableCell sx={{ width: 0.99 }}>Progress</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {budget.categories.map((category) => (
                <CategoryRow key={category.id} state={state} budget={budget} category={category} onClick={onCategoryClicked} />
              ))}
            </TableBody>
          </Table>
        </Box>
      </Scrollbar>
    </Card>
  );
};
