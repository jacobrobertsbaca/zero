import { Divider, Stack, Typography } from "@mui/material";
import { MoneyText } from "src/components/money-text";
import { ActualNominal, Budget, BudgetSummary } from "src/types/budget/types";
import { categoryTitle } from "src/types/category/methods";
import { CategoryType } from "src/types/category/types";
import { TitledSpendingBar } from "../common/spending-bar";

type BudgetCardDetailsProps = {
  budget: Budget;
  summary: BudgetSummary;
};

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
 * Inactive Budgets                                                                                                  *
 * ================================================================================================================= */

const InactiveDetails = ({ summary }: BudgetCardDetailsProps) => {
  return (
    <>
      <Divider sx={{ mt: 2, mb: 2 }} />
      <Stack spacing={1}>
        {summary.categories.map((s) => (
          <TitledSpendingBar
            key={s.type}
            title={categoryTitle(s.type)}
            tooltip={
              s.type === CategoryType.Savings && summary.leftovers && <LeftoverTooltip leftovers={summary.leftovers} />
            }
            {...s}
          />
        ))}
      </Stack>
    </>
  );
};

/* ================================================================================================================= *
 * Details                                                                                                           *
 * ================================================================================================================= */

export const BudgetCardDetails = (props: BudgetCardDetailsProps) => {
  if (props.summary.categories.length === 0) return null;
  return <InactiveDetails {...props} />;
};
