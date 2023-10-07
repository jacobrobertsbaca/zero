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
import { Budget } from "src/types/budget/types";
import { BudgetSummarySelector, BudgetSummaryState } from "../overview/budget-summary-selector";
import { useState } from "react";
import { categoryActual, categoryNominal, categoryTitle } from "src/types/category/methods";
import { SpendingBar } from "../common/spending-bar";

type CategoryListProps = {
  budget: Budget;
};

export const CategoryList = (props: CategoryListProps) => {
  const { budget } = props;
  const [state, setState] = useState(BudgetSummaryState.Current);

  return (
    <Card>
      <CardHeader title="Categories" action={<BudgetSummarySelector value={state} onChange={setState} />} />
      <Scrollbar>
        <Box sx={{ minWidth: 800 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{minWidth: 200}}>Name</TableCell>
                <TableCell sx={{minWidth: 200}}>Period</TableCell>
                <TableCell sx={{width: 0.99}}>Progress</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {budget.categories.map((category) => {
                return (
                  <TableRow hover key={category.id}>
                    <TableCell>
                      <Stack direction="column">
                        <Typography variant="subtitle2">{category.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {categoryTitle(category.type)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{category.recurrence.type}</TableCell>
                    <TableCell>
                      <SpendingBar actual={categoryNominal(category)} nominal={categoryActual(category)} remaining/>
                    </TableCell>  
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Scrollbar>
    </Card>
  );
};
