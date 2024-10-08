import { Stack } from '@mui/material';
import { SettingsPassword } from 'src/sections/settings/settings-password';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { SettingsSignOut } from 'src/sections/settings/settings-sign-out';
import { PageTitle } from 'src/components/page-title';
import { SettingsDeleteAccount } from 'src/sections/settings/settings-delete-account';

const Page = () => (
  <>
    <PageTitle title="Settings" />
    <Stack spacing={3}>
      <SettingsPassword />
      <SettingsSignOut />
      <SettingsDeleteAccount />
    </Stack>
  </>
);

Page.getLayout = (page: React.ReactNode) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;
