import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageTitle } from "src/components/page-title";
import { Skeleton } from "src/components/ui/skeleton";
import { getBudgets } from "src/server/common";
import { BudgetSummaryList } from "src/sections/budgets/single/budget-summary-list";
import { dateFormat } from "src/types/utils/methods";
import { userId } from "src/utils/supabase/server";
import { BudgetCategories, EditBudgetButton } from "./components";

function BudgetSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-muted" />
        <Skeleton className="h-4 w-40 bg-muted" />
      </div>
      <Skeleton className="h-12 w-full max-w-md bg-muted" />
      <Skeleton className="h-64 w-full bg-muted" />
    </div>
  );
}

async function BudgetDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owner = await userId();
  const budgets = await getBudgets(owner, id);
  if (budgets.length === 0) notFound();
  const budget = budgets[0];

  return (
    <>
      <div className="mb-1 flex items-center gap-1">
        <PageTitle title={budget.name} />
        <EditBudgetButton budget={budget} />
      </div>
      <div className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          {`${dateFormat(budget.dates.begin)} — ${dateFormat(budget.dates.end)}`}
        </p>
        <BudgetSummaryList budget={budget} />
        <BudgetCategories budget={budget} />
      </div>
    </>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<BudgetSkeleton />}>
      <BudgetDetails params={params} />
    </Suspense>
  );
}
