import Head from 'next/head';
import { Box, Container, Stack, Typography } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';

const Page = () => (
  <>
  </>
);

Page.getLayout = (page) => (
  <DashboardLayout name='Transactions'>
    {page}
  </DashboardLayout>
);

export default Page;
