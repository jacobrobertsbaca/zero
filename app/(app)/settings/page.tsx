import { createUserClient } from "@/utils/supabase/server";
import { Suspense } from "react";
import { PageTitle } from "src/components/page-title";
import { SettingsDeleteAccount } from "src/sections/settings/settings-delete-account";
import { SettingsPassword as SettingsPasswordClient } from "src/sections/settings/settings-password";
import { SettingsSignOut } from "src/sections/settings/settings-sign-out";

export const metadata = {
  title: "Settings",
};

async function SettingsPassword() {
  const client = await createUserClient();
  const { data } = await client.auth.getClaims();
  const provider = data?.claims.app_metadata?.provider;
  if (provider !== "email") return null;
  return <SettingsPasswordClient className="animate-in fade-in" />;
}

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <div className="mb-3">
        <PageTitle title="Settings" />
      </div>
      <Suspense>
        <SettingsPassword />
      </Suspense>
      <SettingsSignOut />
      <SettingsDeleteAccount />
    </div>
  );
}
