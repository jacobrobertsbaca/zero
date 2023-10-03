import { Unstable_Grid2 as Grid, Button } from '@mui/material';
import { PageTitle } from 'src/components/page-title';
import { useBudgets } from 'src/hooks/use-api';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import BudgetCard from 'src/sections/budgets/overview/budget-card';

const Page = () => {
  const { budgets } = useBudgets();

  return <>
    <PageTitle title="Budgets" />
    <Grid container spacing={4}>
      {budgets && budgets.map(b => <BudgetCard key={b.id} budget={b}/>)}
    </Grid>
  </>
};

Page.getLayout = (page: React.ReactNode) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;
