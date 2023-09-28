import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Unstable_Grid2 as Grid,
  LinearProgress,
  Stack,
  Typography,
  Button,
  SvgIcon,
  Menu,
  MenuItem
} from '@mui/material';

import { ActualNominal, Budget, BudgetStatus } from 'src/types/budget/types';
import { dateFormat } from 'src/types/utils/methods';
import { moneyFactor, moneyFormat, moneySub } from 'src/types/money/methods';
import { budgetStatus, budgetSummaryMerged } from 'src/types/budget/methods';
import { CategoryType } from 'src/types/category/types';
import { useCallback, useMemo, useState } from 'react';
import { categoryActual, categoryNominal, categoryTitle, recurrenceTitle } from 'src/types/category/methods';
import { Money } from 'src/types/money/types';
import { InfoTooltip } from 'src/components/info-tooltip';
import ChevronUpIcon from '@heroicons/react/24/solid/ChevronUpIcon';
import ChevronDownIcon from '@heroicons/react/24/solid/ChevronDownIcon';
import { BudgetSummarySelector, BudgetSummaryState } from './budget-summary-selector';

type SpendingBarProps = ActualNominal & {
  remaining?: boolean
};

const SpendingBar = ({ actual, nominal, remaining }: SpendingBarProps) => {

  const getValue = useCallback(() => {
    if (nominal.amount === 0) return actual.amount >= 0 ? 100 : 0;
    if ((nominal.amount < 0 && actual.amount < 0) || (nominal.amount > 0 && actual.amount > 0))
      return Math.min(100, 100 * actual.amount / nominal.amount);
    return 0;
  }, [actual, nominal]);

  const delta = moneySub(nominal, actual);

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
        <Typography variant="caption">
          <Typography display="inline" variant="inherit" fontWeight={700}>
            {moneyFormat(actual, true)}
          </Typography> of {moneyFormat(nominal, true)}
        </Typography>
        {remaining &&
          <Typography variant="caption">
            <Typography display="inline" variant="inherit" fontWeight={700}>
              {moneyFormat(delta.amount >= 0 ? delta : moneyFactor(delta, -1), true)}
            </Typography> {delta.amount >= 0 ? "left" : "over"}
          </Typography>
        }
      </Box>
    </Box>
  );
};

type TitledSpendingBarProps = SpendingBarProps & {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  tooltip?: React.ReactNode;
};

const TitledSpendingBar = (props: TitledSpendingBarProps) => (
  <Box>
    <Stack direction="row" justifyContent="space-between">
      <Stack direction="row" alignItems="center" spacing={0.25}>
        { typeof props.title === "string"
          ? <Typography variant="subtitle1" color="text.secondary">
            {props.title}
          </Typography>
          : props.title
        }
        {props.tooltip && <InfoTooltip title={props.tooltip} />}
      </Stack>
      { typeof props.subtitle === "string"
        ? <Typography variant="subtitle2" color="text.secondary">
          {props.subtitle}
        </Typography>
        : props.subtitle
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

const BudgetCardDetails = ({ budget, summary }: { budget: Budget, summary: BudgetSummaryState }) => {
  /* Helper component for showing individual categories under
   * a given general category type */
  const CategoriesList = useMemo(() => ({ type, summary }: { type: CategoryType, summary: BudgetSummaryState }) => {
    const filtered = budget.categories.filter(c => c.type === type);
    if (filtered.length === 0) return null;
    return <>
      <Divider sx={{mt: 1 }} />
      <Stack spacing={1} sx={{ mt: 1 }}>
        { filtered.map(c => 
          <TitledSpendingBar 
            key={c.type} 
            title={c.name}
            subtitle={summary === BudgetSummaryState.Current && recurrenceTitle(c.recurrence.type)}
            actual={categoryActual(c)}
            nominal={categoryNominal(c)}
            remaining
          />
        )}
      </Stack>
    </>;
  }, [budget]);

  const { categories, leftovers } = budgetSummaryMerged(budget, CategoryType.Savings);
  if (categories.length === 0) return null;
  if (budgetStatus(budget) === BudgetStatus.Active) {
    return (
      <Stack spacing={2} sx={{ mt: 2 }}>
        { categories.map(s => 
          <Box key={s.type}>
            <Stack direction="row" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={0.25}>
                <Typography variant="h6">{categoryTitle(s.type)}</Typography>
                {leftovers && s.type === CategoryType.Savings &&
                  <InfoTooltip title={<LeftoverTooltip leftovers={leftovers} />} />
                }
              </Stack>
              {summary === BudgetSummaryState.Total &&
                <Typography variant="subtitle1" fontStyle="thin">
                  <Typography variant="subtitle1" fontWeight={800} display="inline">
                    {moneyFormat(s.actual, true)}
                  </Typography>
                  &nbsp;of {moneyFormat(s.nominal, true)}
                </Typography>
              }
            </Stack>
            <CategoriesList type={s.type} summary={summary} />
          </Box>
        )}
      </Stack>
    );
  }

  return (
    <>
      <Divider sx={{ mt: 2, mb: 2 }} />
      <Stack spacing={1}>
        { categories.map(s => <TitledSpendingBar 
          key={s.type} 
          title={categoryTitle(s.type)} 
          tooltip={
            s.type === CategoryType.Savings && leftovers && 
            <LeftoverTooltip leftovers={leftovers} />
          }
          {...s} />
        )}
      </Stack>
    </>
  );
}

type BudgetCardProps = {
  budget: Budget
};

export default function BudgetCard({ budget }: BudgetCardProps) {
  const status = budgetStatus(budget);
  const active = status === BudgetStatus.Active;
  const [summary, setSummary] = useState(BudgetSummaryState.Current);

  return (
    <Grid xs={12} sm={active ? 12 : 6} md={active ? 12 : 4}>
      <Card sx={{ position: "relative", height: "100%" }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between">
            <Typography gutterBottom variant="h5" component="div">
              {budget.name} 
              &nbsp;
              {status === BudgetStatus.Past &&
                <Chip 
                  variant="outlined"
                  label={<Typography variant="caption">Past</Typography>}
                  size="small" 
                />
              }
            </Typography>
            { active && <BudgetSummarySelector value={summary} onChange={setSummary} /> }
          </Stack>
          <Typography variant="subtitle2" color="text.secondary">
            {`${dateFormat(budget.dates.begin)} — ${dateFormat(budget.dates.end)}`}
          </Typography>
          <BudgetCardDetails budget={budget} summary={summary} /> 
        </CardContent>
      </Card>
    </Grid>
  );
};