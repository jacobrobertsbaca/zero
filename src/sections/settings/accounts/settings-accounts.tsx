import { getPlaidConnections, getSubscription } from "src/server/actions";
import { isPlaidConfigured } from "src/server/plaid";
import { SettingsAccountsClient } from "src/sections/settings/accounts/client";

export async function SettingsAccounts() {
  if (!isPlaidConfigured()) return null;

  const [connections, subscription] = await Promise.all([getPlaidConnections(), getSubscription()]);

  return <SettingsAccountsClient connections={connections} subscription={subscription} />;
}
