import { Separator } from "src/components/ui/separator";
import { Budget } from "src/types/budget/types";
import { TitledSpendingBar } from "../common/spending-bar";
import { budgetSummary } from "src/types/budget/methods";

type BudgetCardDetailsProps = {
  budget: Budget;
};

export const BudgetCardDetails = ({ budget }: BudgetCardDetailsProps) => {
  const summary = budgetSummary(budget);

  if (summary.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {summary.map((s) => (
        <TitledSpendingBar key={s.type ?? "leftover"} {...s} />
      ))}
    </div>
  );
};
