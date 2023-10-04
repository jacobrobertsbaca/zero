import { Card, CardActionArea, CardContent, Chip, Unstable_Grid2 as Grid, Stack, Typography } from "@mui/material";

import { Budget, BudgetStatus } from "src/types/budget/types";
import { dateFormat } from "src/types/utils/methods";
import { budgetStatus, budgetSummaryMerged } from "src/types/budget/methods";
import { CategoryType } from "src/types/category/types";
import { useCallback, useState } from "react";
import { BudgetSummarySelector, BudgetSummaryState } from "./budget-summary-selector";
import { BudgetCardDetails } from "./budget-card-details";
import { useRouter } from "next/router";

type BudgetCardProps = {
  budget: Budget;
};

export default function BudgetCard({ budget }: BudgetCardProps) {
  const router = useRouter();
  const status = budgetStatus(budget);
  const active = status === BudgetStatus.Active;
  const summary = budgetSummaryMerged(budget, CategoryType.Savings);
  
  /* For current/total displays on active budgets */
  const [state, setState] = useState(BudgetSummaryState.Current);
  const [anchor, setAnchor] = useState<Element | null>(null);
  
  const onCardClicked = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (anchor) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    router.push(`/budgets/${budget.id}`);
  }, [budget, router, anchor]);
  
  return (
    <Grid xs={12} sm={active ? 12 : 6} md={active ? 12 : 4}>
      <Card sx={{ position: "relative", height: 1 }}>
        <CardActionArea
          onClick={onCardClicked}
          disableRipple={!!anchor}
          sx={{ display: "flex", alignItems: "flex-start", height: 1 }}
        >
          <CardContent sx={{ flexGrow: 1 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography gutterBottom variant="h5" component="div">
                {budget.name}
                &nbsp;
                {status === BudgetStatus.Past && (
                  <Chip variant="outlined" label={<Typography variant="caption">Past</Typography>} size="small" />
                )}
              </Typography>
              {active && (
                <BudgetSummarySelector value={state} onChange={setState} anchor={anchor} onAnchorChange={setAnchor} />
              )}
            </Stack>
            <Typography variant="subtitle2" color="text.secondary">
              {`${dateFormat(budget.dates.begin)} — ${dateFormat(budget.dates.end)}`}
            </Typography>
            <BudgetCardDetails budget={budget} state={state} summary={summary} />
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );
}
