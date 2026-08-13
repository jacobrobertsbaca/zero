import { Suspense } from "react";
import { Card, CardContent } from "src/components/ui/card";
import { Skeleton } from "src/components/ui/skeleton";
import { listBudgets } from "src/server/common";
import BudgetCard from "src/sections/budgets/overview/budget-card";
import { BudgetsOverviewShell } from "src/sections/budgets/overview/budget-metric";
import { userId } from "src/utils/supabase/server";
import { NewBudgetButton } from "./components";

const NoBudgetsOverlay = () => (
  <Card className="col-span-full">
    <CardContent className="flex h-[200px] items-center justify-center p-4">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        Click
        <NewBudgetButton />
        to create a budget
      </div>
    </CardContent>
  </Card>
);

function BudgetCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-md border border-input bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-36 bg-muted" />
        <Skeleton className="h-4 w-44 bg-muted" />
      </div>
    </div>
  );
}

function BudgetsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <BudgetCardSkeleton key={i} />
      ))}
    </div>
  );
}

async function BudgetsGrid() {
  const owner = await userId();
  const budgets = await listBudgets(owner);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {budgets.length === 0 && <NoBudgetsOverlay />}
      {budgets.map((b) => (
        <BudgetCard key={b.id} budget={b} />
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <BudgetsOverviewShell actions={<NewBudgetButton />}>
      <Suspense fallback={<BudgetsSkeleton />}>
        <BudgetsGrid />
      </Suspense>
    </BudgetsOverviewShell>
  );
}
