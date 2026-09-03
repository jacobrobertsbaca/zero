import { Suspense } from "react";
import { Sprout } from "lucide-react";
import { getSubscription } from "src/server/actions";
import { isStripeConfigured } from "src/server/billing";
import { Button } from "src/components/ui/button";
import { Card, CardHeader, CardTitle } from "src/components/ui/card";
import { SettingsPlusClient } from "src/sections/settings/plus/client";

export function SettingsPlus() {
  if (!isStripeConfigured()) return null;

  return (
    <Suspense
      fallback={
        <Card className="border-primary/25 bg-primary/[0.04]">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 py-4">
            <CardTitle className="flex items-center gap-2 text-base text-primary">
              <Sprout className="size-4 shrink-0" />
              Plus
            </CardTitle>
            <Button size="sm" className="shrink-0" disabled>
              Upgrade
            </Button>
          </CardHeader>
        </Card>
      }
    >
      <SettingsPlusData />
    </Suspense>
  );
}

async function SettingsPlusData() {
  return <SettingsPlusClient subscription={await getSubscription()} />;
}
