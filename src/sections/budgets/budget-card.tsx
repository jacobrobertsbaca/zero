import { Box, Card, CardContent, Divider, Unstable_Grid2 as Grid, LinearProgress, Typography } from '@mui/material';

import { Budget, CategorySummary } from 'src/types/budget/types';
import { dateFormat } from 'src/types/utils/methods';
import { moneyFormat } from 'src/types/money/methods';
import { budgetSummary } from 'src/types/budget/methods';

type Props = {
  budget: Budget
};

const SpendingBar = (props: CategorySummary) => {
  const { actual, nominal, type } = props;
  return (
    <Box>
      <LinearProgress
      sx={{ mt: 3 }}
      variant="determinate"
      value={40} />
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

export default function BudgetCard({ budget }: Props) {
  const summary = budgetSummary(budget);

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
          <Divider />
          { summary.map(s => <SpendingBar key={s.type} {...s} />) }
          
        </CardContent>
      </Card>
    </Grid>
  );
};