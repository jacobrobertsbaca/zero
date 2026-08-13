import { Suspense } from "react";
import { PageTitle } from "src/components/page-title";
import { Card, CardContent } from "src/components/ui/card";
import { Skeleton } from "src/components/ui/skeleton";
import { getBudgets } from "src/server/common";
import BudgetCard from "src/sections/budgets/overview/budget-card";
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

function BudgetsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-md bg-muted" />
      ))}
    </div>
  );
}

async function BudgetsGrid() {
  const owner = await userId();
  const budgets = await getBudgets(owner);

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
    <div className="flex flex-col gap-2">
      <div className="mb-3 flex items-center gap-1">
        <PageTitle title="Budgets" />
        <NewBudgetButton />
      </div>
      <Suspense fallback={<BudgetsSkeleton />}>
        <BudgetsGrid />
      </Suspense>
    </div>
  );
}
