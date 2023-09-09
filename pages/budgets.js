import Head from 'next/head';
import { Box, Container, Stack, Typography, Grid, Button } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { generateBudget } from 'src/__mock__/budget';

const Page = () => (
  <>
    <Button onClick={() => console.log(generateBudget())}>Random</Button>
    <Grid container spacing={4}></Grid>
  </>
);

Page.getLayout = (page) => (
  <DashboardLayout name='Budgets'>
    {page}
  </DashboardLayout>
);

export default Page;
