import Head from 'next/head';
import { Box, Container, Stack, Typography, Unstable_Grid2 as Grid, Button } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { useEffect, useState } from 'react';
import { useApi } from 'src/hooks/use-api';
import useAsyncEffect from 'use-async-effect';
import { useSnackbar } from 'notistack';
import BudgetCard from 'src/sections/budgets/overview/budget-card';

const Page = () => {
  type ApiType = Awaited<ReturnType<typeof getBudgets>>;
  const { getBudgets } = useApi();
  const [ budgets, setBudgets ] = useState<ApiType | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  useAsyncEffect(async () => {
    try { setBudgets(await getBudgets()); } 
    catch (err: any) { enqueueSnackbar(err.message, { variant: "error" }); }
  }, []);

  return <>
    <Button onClick={() => console.log(budgets)}>Random</Button>
    <Grid container spacing={4}>
      {budgets && budgets.map(b => <BudgetCard key={b.id} budget={b}/>)}
    </Grid>
  </>
};

Page.getLayout = (page: React.ReactNode) => (
  <DashboardLayout name='Budgets'>
    {page}
  </DashboardLayout>
);

export default Page;
