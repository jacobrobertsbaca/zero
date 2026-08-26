"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Button } from "src/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "src/components/ui/card";
import { useAuth } from "src/hooks/use-auth";
import { wrapAsync } from "src/utils/wrap-errors";

export function SettingsSignOut() {
  const router = useRouter();
  const { signOut } = useAuth();

  const onClick = useCallback(async () => {
    await wrapAsync(async () => {
      await signOut();
      router.replace("/login");
    });
  }, [router, signOut]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 py-4">
        <div className="space-y-1">
          <CardTitle className="text-base">Sign out</CardTitle>
          <CardDescription>End your session on this device</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" onClick={onClick}>
          Sign out
        </Button>
      </CardHeader>
    </Card>
  );
}
