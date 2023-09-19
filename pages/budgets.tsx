import Head from 'next/head';
import { Box, Container, Stack, Typography, Grid, Button } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { useEffect, useState } from 'react';
import { useApi } from 'src/hooks/use-api';
import useAsyncEffect from 'use-async-effect';
import { useSnackbar } from 'notistack';

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
    <Grid container spacing={4}></Grid>
  </>
};

Page.getLayout = (page: React.ReactNode) => (
  <DashboardLayout name='Budgets'>
    {page}
  </DashboardLayout>
);

export default Page;
