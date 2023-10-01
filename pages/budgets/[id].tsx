import { Unstable_Grid2 as Grid, Button, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { PageTitle } from 'src/components/page-title';
import { useBudget } from 'src/hooks/use-api';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';

const Page = () => {
  const router = useRouter();
  const { budget } = useBudget(router.query.id as string);

  return <>
    <PageTitle title={budget?.name ?? "Budgets"} />
    {budget && <Typography variant="h6">
      {budget.name}
    </Typography>}
  </>
};

Page.getLayout = (page: React.ReactNode) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;
