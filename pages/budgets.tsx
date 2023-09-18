import Head from 'next/head';
import { Box, Container, Stack, Typography, Grid, Button } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { useState } from 'react';
import { useApi } from 'src/hooks/use-api';
import useAsyncEffect from 'use-async-effect';

const Page = () => {
  const { getBudgets } = useApi();
  const [ budgets, setBudgets ] = useState<Awaited<ReturnType<typeof getBudgets>> | null>(null);
  
  useAsyncEffect(async () => {
    setBudgets(await getBudgets());
  }, []);

  return <>
    <Button onClick={() => console.log(budgets)}>Random</Button>
    <Grid container spacing={4}></Grid>
  </>
};

Page.getLayout = (page: React.ReactNode) => (
  <DashboardLayout name='Budgets'>
    {page}
  </DashboardLayout>
);

export default Page;
