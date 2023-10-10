import { Unstable_Grid2 as Grid, Button, Typography, Stack } from "@mui/material";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { Loading } from "src/components/loading";
import { PageTitle } from "src/components/page-title";
import { useBudget } from "src/hooks/use-api";
import { Layout as DashboardLayout } from "src/layouts/dashboard/layout";
import { CategoryList } from "src/sections/budgets/single/category-list";
import { CategorySidebar } from "src/sections/budgets/single/category-sidebar";
import { Category, CategoryType, RecurrenceType } from "src/types/category/types";
import { moneyZero } from "src/types/money/methods";
import { dateFormat } from "src/types/utils/methods";

const Page = () => {
  const router = useRouter();
  const { result } = useBudget(router.query.id as string);

  /* Sidebar state. Use dummy category to ensure non-null */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCategory, setSidebarCategory] = useState<Category>({
    id: "",
    name: "",
    type: CategoryType.Income,
    recurrence: { type: RecurrenceType.None, amount: moneyZero() },
    periods: [],
  });

  const onCategoryClicked = useCallback((category: Category) => {
    setSidebarCategory(category);
    setSidebarOpen(true);
  }, []);

  return (
    <Loading value={result}>
      {(budget) => (
        <>
          <PageTitle title={budget.name} />
          <Stack spacing={3}>
            <Typography variant="subtitle1" color="text.secondary">
              {`${dateFormat(budget.dates.begin)} — ${dateFormat(budget.dates.end)}`}
            </Typography>
            <CategoryList budget={budget} onCategoryClicked={onCategoryClicked} />
          </Stack>
          <CategorySidebar open={sidebarOpen} budget={budget} category={sidebarCategory} onClose={() => setSidebarOpen(false)} />
        </>
      )}
    </Loading>
  );
};

Page.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
