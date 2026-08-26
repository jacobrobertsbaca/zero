import { PageTitle } from "src/components/page-title";
import { SettingsDeleteAccount } from "src/sections/settings/settings-delete-account";
import { SettingsPassword } from "src/sections/settings/settings-password";
import { SettingsSignOut } from "src/sections/settings/settings-sign-out";

export const metadata = {
  title: "Settings",
};

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <div className="mb-3">
        <PageTitle title="Settings" />
      </div>
      <SettingsPassword />
      <SettingsSignOut />
      <SettingsDeleteAccount />
    </div>
  );
}
