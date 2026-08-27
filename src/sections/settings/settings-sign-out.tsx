"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Button } from "src/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "src/components/ui/card";
import { supabase } from "src/utils/supabase/client";
import { wrapAsync } from "src/utils/wrap-errors";

export function SettingsSignOut() {
  const router = useRouter();

  const onClick = useCallback(async () => {
    await wrapAsync(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
      router.replace("/login");
    });
  }, [router]);

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
