import { Unstable_Grid2 as Grid } from "@mui/material";
import { Loading } from "src/components/loading";
import { PageTitle } from "src/components/page-title";
import { useBudgets } from "src/hooks/use-api";
import { Layout as DashboardLayout } from "src/layouts/dashboard/layout";
import BudgetCard from "src/sections/budgets/overview/budget-card";

const Page = () => {
  const { result } = useBudgets();

  return (
    <Loading value={result}>
      {(budgets) => (
        <>
          <PageTitle title="Budgets" />
          <Grid container spacing={4}>
            {budgets && budgets.map((b) => <BudgetCard key={b.id} budget={b} />)}
          </Grid>
        </>
      )}
    </Loading>
  );
};

Page.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
