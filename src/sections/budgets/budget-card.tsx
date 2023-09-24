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

import { ActualNominal, Budget, BudgetSummary, CategorySummary } from 'src/types/budget/types';
import { dateFormat } from 'src/types/utils/methods';
import { moneyFormat, moneySub, moneySum } from 'src/types/money/methods';
import { budgetSummary, budgetSummaryMerged } from 'src/types/budget/methods';
import { CategoryType } from 'src/types/category/types';
import { useCallback } from 'react';
import { produce } from 'immer';
import InformationCircleIcon from '@heroicons/react/24/outline/InformationCircleIcon';
import { categoryTitle } from 'src/types/category/methods';
import { Money } from 'src/types/money/types';

const SpendingBar = (props: ActualNominal) => {
  const { actual, nominal } = props;

  const getValue = useCallback(() => {
    if (nominal.amount === 0) return actual.amount >= 0 ? 100 : 0;
    if (nominal.amount < 0) return actual.amount >= 0 ? 0 : 100 * actual.amount / nominal.amount;
    return actual.amount <= 0 ? 0 : 100 * actual.amount / nominal.amount;
  }, [actual, nominal]);

  return (
    <Box>
      <LinearProgress
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

type TitledSpendingBarProps = CategorySummary & {
  title: React.ReactNode;
  tooltip?: React.ReactNode;
};

const TitledSpendingBar = (props: TitledSpendingBarProps) => (
  <Box sx={{ mt: 2 }}>
    <Stack direction="row" alignItems="center" spacing={0.25}>
      <Typography variant="subtitle2" color="text.secondary">
        {props.title}
      </Typography>
      {props.tooltip && 
        <Tooltip title={props.tooltip} placement="top" arrow enterTouchDelay={0}>
          <SvgIcon fontSize="inherit" color="disabled">
            <InformationCircleIcon />
          </SvgIcon>
        </Tooltip>
      }
    </Stack>
    <SpendingBar {...props} />
  </Box>
);

const LeftoverTooltip = (props: { leftovers: ActualNominal }) => {
  const { actual, nominal } = props.leftovers;
  
  const MoneyText = ({ amount }: { amount: Money}) => 
    <Typography 
      variant="inherit" 
      display="inline" 
      color={amount.amount >= 0 ? "success.light" : "warning.main"} 
      fontWeight={600}>
      &nbsp;{moneyFormat(amount)}&nbsp;
    </Typography>

  return (
    <Typography variant="inherit">
      <MoneyText amount={actual} />
      leftover of
      <MoneyText amount={nominal} />
      planned
    </Typography>
  );
};

type BudgetCardProps = {
  budget: Budget
};

export default function BudgetCard({ budget }: BudgetCardProps) {
  const { categories, leftovers } = budgetSummaryMerged(budget, CategoryType.Savings);

  return (
    <Grid xs={12} sm={6} md={4}>
      <Card sx={{ position: "relative", height: "100%" }}>
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {budget.name}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {`${dateFormat(budget.dates.begin)} — ${dateFormat(budget.dates.end)}`}
          </Typography>
          <Divider sx={{ mt: 2 }} />
          { categories.map(s => <TitledSpendingBar 
            key={s.type} 
            title={categoryTitle(s.type)} 
            tooltip={
              s.type === CategoryType.Savings && leftovers && 
              <LeftoverTooltip leftovers={leftovers} />
            }
            {...s} />
          )}
        </CardContent>
      </Card>
    </Grid>
  );
};