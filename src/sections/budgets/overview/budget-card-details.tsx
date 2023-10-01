import { Box, Divider, Link, Stack, Tooltip, Typography } from "@mui/material";
import { InfoTooltip } from "src/components/info-tooltip";
import { budgetStatus } from "src/types/budget/methods";
import { ActualNominal, Budget, BudgetSummary, BudgetStatus } from "src/types/budget/types";
import { categoryActive, categoryActual, categoryNominal, categoryTitle } from "src/types/category/methods";
import { Category, CategoryType, RecurrenceType } from "src/types/category/types";
import { moneyFormat } from "src/types/money/methods";
import { Money } from "src/types/money/types";
import { dateFormat } from "src/types/utils/methods";
import { BudgetSummaryState } from "./budget-summary-selector";
import { TitledSpendingBar } from "./spending-bar";

type BudgetCardDetailsProps = {
  budget: Budget;
  state: BudgetSummaryState;
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

const CategoriesListItem = ({ state, category }: { state: BudgetSummaryState; category: Category }) => {
  const current = state === BudgetSummaryState.Current;
  const title = {
    [RecurrenceType.None]: "Overall",
    [RecurrenceType.Monthly]: "This Month",
    [RecurrenceType.Weekly]: "This Week",
  }[category.recurrence.type];
  
  const activePeriod = categoryActive(category);
  const beginDate = dateFormat(activePeriod!.dates.begin, { excludeYear: true });
  const endDate = dateFormat(activePeriod!.dates.end, { excludeYear: true });
  const activeDates = `${beginDate} — ${endDate}`;

  return (
    <TitledSpendingBar
      title={category.name}
      subtitle={
        current && (
          <Tooltip 
            title={activeDates} 
            enterTouchDelay={0} 
            onClick={event => event.stopPropagation()}
            onMouseDown={event => event.stopPropagation()}
            placement="top" 
            arrow
          >
            <Link 
              color="inherit" 
              underline="hover" 
              onTouchStart={event => event.stopPropagation()}
            >
              {title}
            </Link>
          </Tooltip>
        )
      }
      actual={current ? activePeriod!.actual : categoryActual(category)}
      nominal={current ? activePeriod!.nominal : categoryNominal(category)}
      remaining
    />
  );
};

type CategoriesListProps = BudgetCardDetailsProps & {
  type: CategoryType;
};

const CategoriesList = ({ type, budget, state }: CategoriesListProps) => {
  const filtered = budget.categories.filter((c) => c.type === type);
  if (filtered.length === 0) return null;
  return (
    <>
      <Divider sx={{ mt: 1, mb: 1 }} />
      <Stack spacing={1}>
        {filtered.map((c) => (
          <CategoriesListItem key={c.id} state={state} category={c} />
        ))}
      </Stack>
    </>
  );
};

/* ================================================================================================================= *
 * Active Budgets                                                                                                    *
 * ================================================================================================================= */

const ActiveDetails = ({ budget, summary, state }: BudgetCardDetailsProps) => {
  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      {summary.categories.map((s) => (
        <Box key={s.type}>
          <Stack direction="row" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={0.25}>
              <Typography variant="h6">{categoryTitle(s.type)}</Typography>
              {summary.leftovers && s.type === CategoryType.Savings && (
                <InfoTooltip title={<LeftoverTooltip leftovers={summary.leftovers} />} />
              )}
            </Stack>
            {state === BudgetSummaryState.Total && (
              <Typography variant="subtitle1">
                <Typography variant="subtitle1" fontWeight={800} display="inline">
                  {moneyFormat(s.actual, true)}
                </Typography>
                &nbsp;of {moneyFormat(s.nominal, true)}
              </Typography>
            )}
          </Stack>
          <CategoriesList type={s.type} budget={budget} summary={summary} state={state} />
        </Box>
      ))}
    </Stack>
  );
};

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
  if (budgetStatus(props.budget) === BudgetStatus.Active) return <ActiveDetails {...props} />;
  return <InactiveDetails {...props} />;
};
