import Head from 'next/head';
import { Box, Container, Stack, Typography } from '@mui/material';
import { SettingsNotifications } from 'src/sections/settings/settings-notifications';
import { SettingsPassword } from 'src/sections/settings/settings-password';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { SettingsSignOut } from 'src/sections/settings/settings-sign-out';
import { PageTitle } from 'src/components/page-title';

const Page = () => (
  <>
    <PageTitle title="Settings" />
    <Stack spacing={3}>
      <SettingsPassword />
      <SettingsSignOut />
    </Stack>
  </>
);

Page.getLayout = (page: React.ReactNode) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;
