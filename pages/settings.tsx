import Head from 'next/head';
import { Box, Container, Stack, Typography } from '@mui/material';
import { SettingsNotifications } from 'src/sections/settings/settings-notifications';
import { SettingsPassword } from 'src/sections/settings/settings-password';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { SettingsSignOut } from 'src/sections/settings/settings-sign-out';

const Page = () => (
  <Stack spacing={3} sx={{ mt: 3 }}>
    <SettingsPassword />
    <SettingsSignOut />
  </Stack>
);

Page.getLayout = (page: React.ReactNode) => (
  <DashboardLayout name='Settings'>
    {page}
  </DashboardLayout>
);

export default Page;