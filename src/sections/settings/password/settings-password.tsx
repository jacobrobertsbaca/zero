import { createUserClient } from "@/utils/supabase/server";
import { SettingsPasswordClient } from "src/sections/settings/password/client";

export async function SettingsPassword() {
  const client = await createUserClient();
  const { data } = await client.auth.getClaims();
  const provider = data?.claims.app_metadata?.provider;
  if (provider !== "email") return null;
  return <SettingsPasswordClient className="animate-in fade-in" />;
}
