import { Divider, Stack, Typography } from "@mui/material";
import { MoneyText } from "src/components/money-text";
import { ActualNominal, Budget, BudgetSummary } from "src/types/budget/types";
import { categoryTitle } from "src/types/category/methods";
import { CategoryType } from "src/types/category/types";
import { TitledSpendingBar } from "../common/spending-bar";
import { budgetSummary } from "src/types/budget/methods";

/* ================================================================================================================= *
 * Utility Components                                                                                                *
 * ================================================================================================================= */

const LeftoverTooltip = (props: { leftovers: ActualNominal }) => (
  <Typography variant="caption">
    <MoneyText amount={props.leftovers.actual} fontWeight={600} status />
    &nbsp;leftover of&nbsp;
    <MoneyText amount={props.leftovers.nominal} fontWeight={600} status />
    &nbsp;planned
  </Typography>
);

/* ================================================================================================================= *
 * Details                                                                                                           *
 * ================================================================================================================= */

type BudgetCardDetailsProps = {
  budget: Budget;
};

export const BudgetCardDetails = ({ budget }: BudgetCardDetailsProps) => {
  const summary = budgetSummary(budget);

  if (summary.length === 0) return null;
  return (
    <>
      <Divider sx={{ mt: 2, mb: 2 }} />
      <Stack spacing={1}>
        {summary.map((s) => (
          <TitledSpendingBar key={s.type ?? "leftover"} {...s} />
        ))}
      </Stack>
    </>
  );
};
