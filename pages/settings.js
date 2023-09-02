import Head from 'next/head';
import { Box, Container, Stack, Typography } from '@mui/material';
import { SettingsNotifications } from 'src/sections/settings/settings-notifications';
import { SettingsPassword } from 'src/sections/settings/settings-password';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';

const Page = () => (
  <>
    <SettingsNotifications />
    <SettingsPassword />
  </>
);

Page.getLayout = (page) => (
  <DashboardLayout name='Settings'>
    {page}
  </DashboardLayout>
);

export default Page;
