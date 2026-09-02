import { getSubscription } from "src/server/actions";
import { isStripeConfigured } from "src/server/billing";
import { SettingsPlusClient } from "src/sections/settings/plus/client";

export async function SettingsPlus() {
  if (!isStripeConfigured()) return null;
  return <SettingsPlusClient subscription={await getSubscription()} />;
}
