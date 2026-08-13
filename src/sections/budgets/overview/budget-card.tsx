import Link from "next/link";
import { Budget } from "src/types/budget/types";
import { dateFormat } from "src/types/utils/methods";
import { BudgetCardDetails } from "./budget-card-details";
import { cn } from "src/utils";

type BudgetCardProps = {
  budget: Budget;
};

export default function BudgetCard({ budget }: BudgetCardProps) {
  return (
    <Link
      href={`/budgets/${budget.id}`}
      className={cn(
        "flex h-full flex-col rounded-md border border-input bg-card p-4 text-card-foreground shadow-sm",
        "cursor-pointer no-underline transition-colors hover:bg-muted/40"
      )}
    >
      <div className="flex shrink-0 flex-col gap-1">
        <div className="text-lg font-semibold leading-tight">{budget.name}</div>
        <div className="text-sm text-muted-foreground">
          {`${dateFormat(budget.dates.begin)} — ${dateFormat(budget.dates.end)}`}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-end">
        <BudgetCardDetails budgetId={budget.id} />
      </div>
    </Link>
  );
}
