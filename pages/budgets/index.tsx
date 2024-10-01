import { Box, Card, IconButton, Stack, SvgIcon, Unstable_Grid2 as Grid } from "@mui/material";
import { Loading } from "src/components/loading";
import { PageTitle } from "src/components/page-title";
import { useBudgets } from "src/hooks/use-api";
import { Layout as DashboardLayout } from "src/layouts/dashboard/layout";
import BudgetCard from "src/sections/budgets/overview/budget-card";

import PlusIcon from "@heroicons/react/24/solid/PlusIcon";
import { useState } from "react";
import { BudgetSidebar } from "src/sections/budgets/common/budget-sidebar";
import { useRouter } from "next/router";
import { Dates } from "src/types/utils/types";

const NoBudgetsOverlay = () => (
  <Grid xs={12}>
    <Card>
      <Stack alignItems="center" justifyContent="center" height="200px">
        <Stack alignItems="center" direction="row">
          Click&nbsp;
          <SvgIcon sx={{ display: "inline" }}>
            <PlusIcon />
          </SvgIcon>
          &nbsp;to create a budget
        </Stack>
      </Stack>
    </Card>
  </Grid>
);

const Page = () => {
  const router = useRouter();
  const { budgets, error } = useBudgets();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="normal" spacing={0.5}>
        <PageTitle title="Budgets" />
        <Box>
          <IconButton color="inherit" onClick={() => setSidebarOpen(true)}>
            <SvgIcon>
              <PlusIcon />
            </SvgIcon>
          </IconButton>
        </Box>
      </Stack>
      <Loading value={budgets} error={error}>
        {(budgets) => (
          <Grid container spacing={4}>
            {budgets.length === 0 && <NoBudgetsOverlay />}
            {budgets.map((b) => (
              <BudgetCard key={b.id} budget={b} />
            ))}
          </Grid>
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
    </Stack>
  );
};

Page.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
