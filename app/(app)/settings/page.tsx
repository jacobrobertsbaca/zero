import { Suspense } from "react";
import { PageTitle } from "src/components/page-title";
import { SettingsAccounts } from "src/sections/settings/accounts/settings-accounts";
import { SettingsDeleteAccount } from "src/sections/settings/settings-delete-account";
import { SettingsPassword } from "src/sections/settings/password/settings-password";
import { SettingsPlus } from "src/sections/settings/plus/settings-plus";
import { SettingsSection } from "src/sections/settings/settings-section";
import { SettingsSignOut } from "src/sections/settings/settings-sign-out";

export const metadata = {
  title: "Settings",
};

export default function Page() {
  return (
    <div className="flex flex-col gap-8">
      <PageTitle title="Settings" />

      <SettingsSection title="External Accounts">
        <Suspense>
          <SettingsPlus />
        </Suspense>
        <Suspense>
          <SettingsAccounts />
        </Suspense>
      </SettingsSection>

      <SettingsSection title="Account">
        <Suspense>
          <SettingsPassword />
        </Suspense>
        <SettingsSignOut />
        <SettingsDeleteAccount />
      </SettingsSection>
    </div>
  );
}
