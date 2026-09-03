import { Suspense } from "react";
import { Plus } from "lucide-react";
import { getPlaidConnections, getSubscription } from "src/server/actions";
import { isPlaidConfigured } from "src/server/plaid";
import { Button } from "src/components/ui/button";
import { Card, CardHeader, CardTitle } from "src/components/ui/card";
import { SettingsAccountsClient } from "src/sections/settings/accounts/client";

export function SettingsAccounts() {
  if (!isPlaidConfigured()) return null;

  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
            <CardTitle className="text-base">Connected accounts</CardTitle>
            <Button variant="outline" size="sm" className="shrink-0" disabled>
              <Plus className="size-3.5" />
              Connect
            </Button>
          </CardHeader>
        </Card>
      }
    >
      <SettingsAccountsData />
    </Suspense>
  );
}

async function SettingsAccountsData() {
  const [connections, subscription] = await Promise.all([getPlaidConnections(), getSubscription()]);

  return <SettingsAccountsClient connections={connections} subscription={subscription} />;
}
