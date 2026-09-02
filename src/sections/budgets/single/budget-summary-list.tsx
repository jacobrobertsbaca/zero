import { Fragment } from "react";
import { MoneyText } from "src/components/money-text";
import { Separator } from "src/components/ui/separator";
import { budgetSummary } from "src/types/budget/methods";
import { Budget } from "src/types/budget/types";
import { RoundingMode } from "src/types/money/methods";

type BudgetSummaryListProps = {
  budget: Budget;
};

export const BudgetSummaryList = ({ budget }: BudgetSummaryListProps) => {
  const summary = budgetSummary(budget);

  if (!summary.length) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      {summary.map((item, index) => (
        <Fragment key={item.title}>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">{item.title}</span>
            <span className="text-sm">
              <MoneyText amount={item.actual} round={RoundingMode.RoundZero} />
              &nbsp;of&nbsp;
              <MoneyText amount={item.nominal} round={RoundingMode.RoundZero} />
            </span>
          </div>
          {index < summary.length - 1 && (
            <>
              <Separator className="sm:hidden" />
              <Separator orientation="vertical" className="hidden h-8 sm:block" />
            </>
          )}
        </Fragment>
      ))}
    </div>
  );
};
