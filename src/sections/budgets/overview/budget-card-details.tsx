import { Divider, Stack, Typography } from "@mui/material";
import { ActualNominal, Budget, BudgetSummary } from "src/types/budget/types";
import { categoryTitle } from "src/types/category/methods";
import { CategoryType } from "src/types/category/types";
import { moneyFormat } from "src/types/money/methods";
import { Money } from "src/types/money/types";
import { TitledSpendingBar } from "../common/spending-bar";

type BudgetCardDetailsProps = {
  budget: Budget;
  summary: BudgetSummary;
};

/* ================================================================================================================= *
 * Utility Components                                                                                                *
 * ================================================================================================================= */

const MoneyText = ({ amount }: { amount: Money }) => (
  <Typography
    variant="inherit"
    display="inline"
    color={amount.amount >= 0 ? "success.light" : "warning.main"}
    fontWeight={600}
  >
    &nbsp;{moneyFormat(amount)}&nbsp;
  </Typography>
);

const LeftoverTooltip = (props: { leftovers: ActualNominal }) => (
  <Typography variant="caption">
    <MoneyText amount={props.leftovers.actual} />
    leftover of
    <MoneyText amount={props.leftovers.nominal} />
    planned
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
