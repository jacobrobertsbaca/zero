import { Suspense } from "react";
import { getBudgetTimeline } from "src/server/common";
import { userId } from "src/utils/supabase/server";
import { BudgetTimelineChart } from "./budget-chart";

async function BudgetTimeline({ budgetId }: { budgetId: string }) {
  const owner = await userId();
  const timeline = await getBudgetTimeline(owner, budgetId);
  if (!timeline) return null;

  return (
    <div className="budget-chart-expand">
      <div className="budget-chart-expand-inner">
        <div className="h-[148px] w-full overflow-visible pt-4 pb-1">
          <BudgetTimelineChart timeline={timeline} />
        </div>
      </div>
    </div>
  );
}

export function BudgetCardDetails({ budgetId }: { budgetId: string }) {
  return (
    <Suspense fallback={null}>
      <BudgetTimeline budgetId={budgetId} />
    </Suspense>
  );
}
