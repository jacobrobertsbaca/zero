import Head from 'next/head';
import { Box, Container, Stack, Typography } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { PageTitle } from 'src/components/page-title';

const Page = () => (
  <>
    <PageTitle title="Transactions" />
  </>
);

Page.getLayout = (page: React.ReactNode) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;
