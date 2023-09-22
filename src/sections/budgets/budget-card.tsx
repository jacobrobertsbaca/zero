import { 
  Box, 
  Card, 
  CardContent, 
  Divider, 
  Unstable_Grid2 as Grid, 
  LinearProgress, 
  Theme, 
  Typography, 
  linearProgressClasses, 
  styled
} from '@mui/material';

import { Budget, CategorySummary } from 'src/types/budget/types';
import { dateFormat } from 'src/types/utils/methods';
import { moneyFormat } from 'src/types/money/methods';
import { budgetSummary } from 'src/types/budget/methods';
import { CategoryType } from 'src/types/category/types';
import { useCallback } from 'react';

type Props = {
  budget: Budget
};

const SpendingBar = (props: CategorySummary) => {
  const { actual, nominal, type } = props;

  const getColors = useCallback((theme: Theme) => {
    if (type === CategoryType.Income)
      return { fg: theme.palette.primary.main, bg: theme.palette.primary.light };
    if (type === CategoryType.Investments)
      return { fg: theme.palette.info.main, bg: theme.palette.info.light };
    if (type === CategoryType.Spending)
      return { fg: theme.palette.warning.main, bg: theme.palette.warning.light };
    return { fg: theme.palette.success.dark, bg: theme.palette.success.light };
  }, [type]);

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
        value={40} 
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

const TitledSpendingBar = (props: CategorySummary) => {
  const { type } = props;
  let title;
  if (type === CategoryType.Income) title = "Income";
  else if (type === CategoryType.Investments) title = "Investments";
  else if (type === CategoryType.Spending) title = "Spending";
  else if (type === CategoryType.Savings) title = "Savings";
  return <Box sx={{ mt: 2 }}>
    <Typography variant="subtitle2">{title}</Typography>
    <SpendingBar {...props} />
  </Box>
};

export default function BudgetCard({ budget }: Props) {
  const summary = budgetSummary(budget);
  const categorySummaries = summary.filter(cs => !!cs.type);
  const leftoverSummary   = summary.find(cs => !cs.type);

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
          { categorySummaries.map(s => <TitledSpendingBar key={s.type} {...s} />) }
          
        </CardContent>
      </Card>
    </Grid>
  );
};