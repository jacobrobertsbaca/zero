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
import { moneyFormat } from 'src/types/money/methods';
import { budgetStatus, budgetSummaryMerged } from 'src/types/budget/methods';
import { CategoryType } from 'src/types/category/types';
import { useCallback, useMemo, useState } from 'react';
import { categoryActual, categoryNominal, categoryTitle } from 'src/types/category/methods';
import { Money } from 'src/types/money/types';
import { InfoTooltip } from 'src/components/info-tooltip';
import ChevronUpIcon from '@heroicons/react/24/solid/ChevronUpIcon';
import ChevronDownIcon from '@heroicons/react/24/solid/ChevronDownIcon';

const SpendingBar = (props: ActualNominal) => {
  const { actual, nominal } = props;

  const getValue = useCallback(() => {
    if (nominal.amount === 0) return actual.amount >= 0 ? 100 : 0;
    if ((nominal.amount < 0 && actual.amount < 0) || (nominal.amount > 0 && actual.amount > 0))
      return Math.min(100, 100 * actual.amount / nominal.amount);
    return 0;
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

type TitledSpendingBarProps = ActualNominal & {
  title: React.ReactNode;
  tooltip?: React.ReactNode;
};

const TitledSpendingBar = (props: TitledSpendingBarProps) => (
  <Box>
    <Stack direction="row" alignItems="center" spacing={0.25}>
      <Typography variant="subtitle2" color="text.secondary">
        {props.title}
      </Typography>
      {props.tooltip && <InfoTooltip title={props.tooltip} />}
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

const BudgetCardDetails = ({ budget }: { budget: Budget }) => {
  /* Helper component for showing individual categories under
   * a given general category type */
  const CategoriesList = useMemo(() => ({ type }: { type: CategoryType}) => {
    const filtered = budget.categories.filter(c => c.type === type);
    if (filtered.length === 0) return null;
    return <>
      <Divider sx={{mt: 1 }} />
      <Stack spacing={1} sx={{ mt: 1 }}>
        { filtered.map(c => 
          <TitledSpendingBar 
            key={c.type} 
            title={c.name}
            actual={categoryActual(c)}
            nominal={categoryNominal(c)}
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
              <Typography variant="subtitle1" fontStyle="thin">
                <Typography variant="subtitle1" fontWeight={800} display="inline">
                  {moneyFormat(s.actual, true)}
                </Typography>
                &nbsp;of {moneyFormat(s.nominal, true)}
              </Typography>
            </Stack>
            <CategoriesList type={s.type} />
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

const SORT_BY_OPTIONS = [
  { value: 'current', label: 'Current' },
  { value: 'summary', label: 'Summary' },
];

const BudgetSummarySelector = () => {
  const [open, setOpen] = useState(null);

  const handleOpen = (event: any) => {
    setOpen(event.currentTarget);
  };

  const handleClose = () => {
    setOpen(null);
  };

  return (
    <>
      <Button
        color="inherit"
        disableRipple
        onClick={handleOpen}
        endIcon={<SvgIcon>{open ? <ChevronUpIcon /> : <ChevronDownIcon />}</SvgIcon>}
      >
        <Typography component="span" variant="subtitle2" color="text.secondary">
          Current
        </Typography>
      </Button>
      <Menu
        keepMounted
        anchorEl={open}
        open={Boolean(open)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {SORT_BY_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === 'newest'}
            onClick={handleClose}
            sx={{ typography: 'body2' }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

type BudgetCardProps = {
  budget: Budget
};

export default function BudgetCard({ budget }: BudgetCardProps) {
  const status = budgetStatus(budget);
  const active = status === BudgetStatus.Active;

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
            <BudgetSummarySelector />
          </Stack>
          <Typography variant="subtitle2" color="text.secondary">
            {`${dateFormat(budget.dates.begin)} — ${dateFormat(budget.dates.end)}`}
          </Typography>
          <BudgetCardDetails budget={budget} /> 
        </CardContent>
      </Card>
    </Grid>
  );
};