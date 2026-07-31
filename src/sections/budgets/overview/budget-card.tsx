import Link from "next/link";
import { Badge } from "src/components/ui/badge";
import { Budget, BudgetStatus } from "src/types/budget/types";
import { dateFormat } from "src/types/utils/methods";
import { budgetStatus } from "src/types/budget/methods";
import { BudgetCardDetails } from "./budget-card-details";
import { cn } from "src/lib/utils";

type BudgetCardProps = {
  budget: Budget;
};

export default function BudgetCard({ budget }: BudgetCardProps) {
  const status = budgetStatus(budget);

  return (
    <Link
      href={`/budgets/${budget.id}`}
      className={cn(
        "row-span-2 grid grid-rows-subgrid gap-4 rounded-md border border-input bg-card p-4 text-card-foreground shadow-sm",
        "cursor-pointer no-underline transition-colors hover:bg-muted/40"
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="text-lg font-semibold">{budget.name}</div>
        <div className="text-sm text-muted-foreground">
          {`${dateFormat(budget.dates.begin)} — ${dateFormat(budget.dates.end)}`}
        </div>
        {status === BudgetStatus.Past && (
          <div>
            <Badge variant="outline" className="font-normal text-muted-foreground">
              Past
            </Badge>
          </div>
        )}
      </div>
      <div>
        <BudgetCardDetails budget={budget} />
      </div>
    </Link>
  );
}
