import { Card, CardActionArea, CardContent, Chip, Unstable_Grid2 as Grid, Stack, Typography, Box } from "@mui/material";

import { Budget, BudgetStatus } from "src/types/budget/types";
import { dateFormat } from "src/types/utils/methods";
import { budgetStatus } from "src/types/budget/methods";
import { useCallback } from "react";
import { BudgetCardDetails } from "./budget-card-details";
import { useRouter } from "next/router";

type BudgetCardProps = {
  budget: Budget;
};

export default function BudgetCard({ budget }: BudgetCardProps) {
  const router = useRouter();
  const status = budgetStatus(budget);

  const onCardClicked = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      router.push(`/budgets/${budget.id}`);
    },
    [budget, router]
  );

  return (
    <Grid xs={12} sm={6} md={4}>
      <Card sx={{ position: "relative", height: 1 }}>
        <CardActionArea onClick={onCardClicked} sx={{ display: "flex", alignItems: "flex-start", height: 1 }}>
          <CardContent sx={{ flexGrow: 1 }}>
            <Stack spacing={1}>
              <Typography variant="h5" component="div">
                {budget.name}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {`${dateFormat(budget.dates.begin)} — ${dateFormat(budget.dates.end)}`}
              </Typography>
              {status === BudgetStatus.Past && (
                <Box>
                  <Chip variant="outlined" label={<Typography variant="caption">Past</Typography>} size="small" />
                </Box>
              )}
            </Stack>
            <BudgetCardDetails budget={budget} />
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );
}
