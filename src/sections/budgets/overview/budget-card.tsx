import { useCallback } from "react";
import { useRouter } from "next/router";
import { Card, CardContent } from "src/components/ui/card";
import { Badge } from "src/components/ui/badge";
import { Budget, BudgetStatus } from "src/types/budget/types";
import { dateFormat } from "src/types/utils/methods";
import { budgetStatus } from "src/types/budget/methods";
import { BudgetCardDetails } from "./budget-card-details";

type BudgetCardProps = {
  budget: Budget;
};

export default function BudgetCard({ budget }: BudgetCardProps) {
  const router = useRouter();
  const status = budgetStatus(budget);

  const onCardClicked = useCallback(() => {
    router.push(`/budgets/${budget.id}`);
  }, [budget, router]);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onCardClicked}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onCardClicked();
      }}
      className="row-span-2 grid cursor-pointer grid-rows-subgrid gap-4 p-4 transition-colors hover:bg-muted/40"
    >
      <CardContent className="contents p-0">
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
      </CardContent>
    </Card>
  );
}
