import Head from 'next/head';
import { Box, Container, Stack, Typography, Grid } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';

const Page = () => (
  <>
    <Grid container spacing={4}></Grid>
  </>
);

Page.getLayout = (page) => (
  <DashboardLayout name='Budgets'>
    {page}
  </DashboardLayout>
);

export default Page;
