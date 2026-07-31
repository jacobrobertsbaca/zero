import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { Loading } from "src/components/loading";
import { PageTitle } from "src/components/page-title";
import { useBudget } from "src/hooks/use-api";
import { Layout as DashboardLayout } from "src/layouts/dashboard/layout";
import { BudgetSummaryList } from "src/sections/budgets/single/budget-summary-list";
import { CategoryList } from "src/sections/budgets/single/category-list";
import { CategorySidebar } from "src/sections/budgets/single/category-sidebar";
import { categoryDefault } from "src/types/category/methods";
import { Category } from "src/types/category/types";
import { dateFormat } from "src/types/utils/methods";
import { Button } from "src/components/ui/button";

import { Pencil } from "lucide-react";
import { BudgetSidebar } from "src/sections/budgets/common/budget-sidebar";

const Page = () => {
  const router = useRouter();
  const { budget, error } = useBudget(router.query.id as string);

  /* Sidebar state. Use dummy category to ensure non-null */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCategory, setSidebarCategory] = useState(categoryDefault());
  const [detailsSidebarOpen, setDetailsSidebarOpen] = useState(false);

  const onCategoryClicked = useCallback((category: Category) => {
    setSidebarCategory(category);
    setSidebarOpen(true);
  }, []);

  if (!budget) return <Loading error={error} />;

  return (
    <>
      <div className="mb-3 flex items-center gap-1">
        <PageTitle title={budget.name} />
        <Button type="button" variant="ghost" size="icon" onClick={() => setDetailsSidebarOpen(true)}>
          <Pencil className="size-4" />
          <span className="sr-only">Edit Budget</span>
        </Button>
      </div>
      <div className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          {`${dateFormat(budget.dates.begin)} — ${dateFormat(budget.dates.end)}`}
        </p>
        <BudgetSummaryList budget={budget} />
        <CategoryList budget={budget} onCategoryClicked={onCategoryClicked} />
      </div>
      <CategorySidebar
        open={sidebarOpen}
        budget={budget}
        category={sidebarCategory}
        onClose={() => setSidebarOpen(false)}
        onUpdate={(category) => {
          setSidebarCategory(category);
        }}
        onDelete={() => {
          setSidebarOpen(false);
        }}
      />
      <BudgetSidebar
        budget={budget}
        open={detailsSidebarOpen}
        onClose={() => setDetailsSidebarOpen(false)}
        onDelete={() => router.replace("/budgets")}
      />
    </>
  );
};

Page.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
