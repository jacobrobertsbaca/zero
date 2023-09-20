import { Card, CardContent, Unstable_Grid2 as Grid, LinearProgress, Typography } from '@mui/material';

import { Budget } from 'src/types/budget/types';
import { budgetActual, budgetNominal } from 'src/types/budget/methods';
import { dateFormat } from 'src/types/utils/methods';
import { moneyFormat } from 'src/types/money/methods';

type Props = {
  budget: Budget
};

export default function BudgetCard({ budget }: Props) {
  const actual = budgetActual(budget);
  const nominal = budgetNominal(budget);
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
          <Typography variant="body2" color="text.secondary">
            Actual: {moneyFormat(actual)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nominal: {moneyFormat(nominal)}
          </Typography>
          <LinearProgress 
            sx={{ mt: 3 }}
            variant="determinate" 
            value={40} 
          />
        </CardContent>
      </Card>
    </Grid>
  );
};