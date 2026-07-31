import { Plus } from "lucide-react";
import { Loading } from "src/components/loading";
import { PageTitle } from "src/components/page-title";
import { useBudgets } from "src/hooks/use-api";
import { Layout as DashboardLayout } from "src/layouts/dashboard/layout";
import BudgetCard from "src/sections/budgets/overview/budget-card";

import { useState } from "react";
import { BudgetSidebar } from "src/sections/budgets/common/budget-sidebar";
import { useRouter } from "next/router";
import { Dates } from "src/types/utils/types";
import { Button } from "src/components/ui/button";
import { Card, CardContent } from "src/components/ui/card";

const NoBudgetsOverlay = () => (
  <Card className="col-span-full">
    <CardContent className="flex h-[200px] items-center justify-center p-4">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        Click
        <Plus className="inline size-4" />
        to create a budget
      </div>
    </CardContent>
  </Card>
);

const Page = () => {
  const router = useRouter();
  const { budgets, error } = useBudgets();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-3 flex items-center gap-1">
        <PageTitle title="Budgets" />
        <Button type="button" variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Plus className="size-4" />
          <span className="sr-only">New Budget</span>
        </Button>
      </div>
      <Loading value={budgets} error={error}>
        {(budgets) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {budgets.length === 0 && <NoBudgetsOverlay />}
            {budgets.map((b) => (
              <BudgetCard key={b.id} budget={b} />
            ))}
          </div>
        )}
      </Loading>
      <BudgetSidebar
        budget={{
          id: "",
          name: "",
          dates: { begin: null, end: null } as unknown as Dates,
          categories: [],
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onUpdate={(budget) => {
          router.push(`/budgets/${budget.id}`);
          return false;
        }}
      />
    </div>
  );
};

Page.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
