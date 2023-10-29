import Head from 'next/head';
import { Box, Container, Stack, Typography } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { PageTitle } from 'src/components/page-title';
import { TransactionList } from 'src/sections/transactions/transaction-list';

const Page = () => (
  <>
    <PageTitle title="Transactions" />
    <TransactionList />
  </>
);

Page.getLayout = (page: React.ReactNode) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;
