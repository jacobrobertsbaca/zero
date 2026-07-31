import { SettingsPassword } from "src/sections/settings/settings-password";
import { Layout as DashboardLayout } from "src/layouts/dashboard/layout";
import { SettingsSignOut } from "src/sections/settings/settings-sign-out";
import { PageTitle } from "src/components/page-title";
import { SettingsDeleteAccount } from "src/sections/settings/settings-delete-account";

const Page = () => (
  <>
    <div className="mb-3">
      <PageTitle title="Settings" />
    </div>
    <div className="flex flex-col gap-4">
      <SettingsPassword />
      <SettingsSignOut />
      <SettingsDeleteAccount />
    </div>
  </>
);

Page.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
