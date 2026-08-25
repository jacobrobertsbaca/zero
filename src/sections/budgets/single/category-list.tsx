import { Suspense } from "react";
import { getCategoryTimeline } from "src/server/common";
import { categoryNominal } from "src/types/category/methods";
import { Category, CategoryType } from "src/types/category/types";
import { Budget } from "src/types/budget/types";
import { Dates } from "src/types/utils/types";
import { userId } from "src/utils/supabase/server";
import { CategoryListClient, CategoryCard, CategoryTimelineChart } from "./category-list-client";

function CategoryChartSkeleton() {
  return <div className="h-10 w-full" />;
}

async function CategoryProgress({
  budgetId,
  dates,
  category,
}: {
  budgetId: string;
  dates: Dates;
  category: Category;
}) {
  const owner = await userId();
  const timeline = await getCategoryTimeline(owner, budgetId, category.id, dates.begin, dates.end);
  const limit = categoryNominal(category).amount;
  const warn = category.type === CategoryType.Spending;

  return (
    <div className="h-full w-full min-w-0">
      <CategoryTimelineChart timeline={timeline} limit={limit} warn={warn} />
    </div>
  );
}

export function CategoryList({ budget }: { budget: Budget }) {
  return (
    <CategoryListClient budget={budget}>
      {budget.categories.map((category) => (
        <CategoryCard key={category.id} category={category}>
          <Suspense fallback={<CategoryChartSkeleton />}>
            <CategoryProgress budgetId={budget.id} dates={budget.dates} category={category} />
          </Suspense>
        </CategoryCard>
      ))}
    </CategoryListClient>
  );
}
