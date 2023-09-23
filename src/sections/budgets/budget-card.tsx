import {
  Box,
  Card,
  CardContent,
  Divider,
  Unstable_Grid2 as Grid,
  LinearProgress,
  Stack,
  SvgIcon,
  Theme,
  Tooltip,
  Typography,
  linearProgressClasses,
  styled
} from '@mui/material';

import { Budget, BudgetSummary, CategorySummary } from 'src/types/budget/types';
import { dateFormat } from 'src/types/utils/methods';
import { moneyFormat, moneySub, moneySum } from 'src/types/money/methods';
import { budgetSummary, budgetSummaryMerged } from 'src/types/budget/methods';
import { CategoryType } from 'src/types/category/types';
import { useCallback } from 'react';
import { produce } from 'immer';
import InformationCircleIcon from '@heroicons/react/24/outline/InformationCircleIcon';
import { categoryTitle } from 'src/types/category/methods';

const SpendingBar = (props: CategorySummary) => {
  const { actual, nominal, type } = props;

  const getColors = useCallback((theme: Theme) => {
    if (type === CategoryType.Income)
      return { fg: theme.palette.grey.A400, bg: theme.palette.grey.A200 };
    if (type === CategoryType.Investments)
      return { fg: theme.palette.info.main, bg: theme.palette.info.light };
    if (type === CategoryType.Spending)
      return { fg: theme.palette.warning.main, bg: theme.palette.warning.light };
    return { fg: theme.palette.success.main, bg: theme.palette.success.lightest };
  }, [type]);

  const getValue = useCallback(() => {
    if (nominal.amount === 0) return actual.amount >= 0 ? 100 : 0;
    if (nominal.amount < 0) return actual.amount >= 0 ? 0 : 100 * actual.amount / nominal.amount;
    return actual.amount <= 0 ? 0 : 100 * actual.amount / nominal.amount;
  }, [actual, nominal]);

  const StyledProgress = styled(LinearProgress)(({ theme }) => {
    const colors = getColors(theme);
    return {
      [`&.${linearProgressClasses.determinate}`]: { backgroundColor: colors.bg },
      [`& > .${linearProgressClasses.bar1Determinate}`]: { backgroundColor: colors.fg }
    }
  });

  return (
    <Box>
      <StyledProgress
        variant="determinate"
        value={getValue()}
      />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between"
        }}
      >
        <Typography variant="subtitle2">{moneyFormat(actual)}</Typography>
        <Typography variant="subtitle2">{moneyFormat(nominal)}</Typography>
      </Box>
    </Box>
  );
};

const TitledSpendingBar = (props: CategorySummary & { title: React.ReactNode }) => (
  <Box sx={{ mt: 2 }}>
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Typography variant="subtitle2" color="text.secondary">
        {props.title}
      </Typography>
    </Stack>
    <SpendingBar {...props} />
  </Box>
);

type BudgetCardProps = {
  budget: Budget
};

export default function BudgetCard({ budget }: BudgetCardProps) {
  const { categories, leftovers } = budgetSummaryMerged(budget, CategoryType.Savings);
  const getTitle = useCallback((summary: CategorySummary) => {
    let title = categoryTitle(summary.type);
    if (summary.type === CategoryType.Savings && leftovers)
      title += " and Leftovers";
    return title;
  }, [leftovers]);

  return (
    <Grid xs={12} sm={6} md={4}>
      <Card sx={{ position: 'relative' }}>
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {budget.name}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {`${dateFormat(budget.dates.begin)} — ${dateFormat(budget.dates.end)}`}
          </Typography>
          <Divider sx={{ mt: 2 }} />
          { categories.map(s => <TitledSpendingBar key={s.type} title={getTitle(s)} {...s} />)}
        </CardContent>
      </Card>
    </Grid>
  );
};