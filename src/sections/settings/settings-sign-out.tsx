import { useCallback } from "react";
import { useAuth } from "src/hooks/use-auth";
import { wrapAsync } from "src/utils/wrap-errors";
import { Button } from "src/components/ui/button";
import { Card, CardHeader, CardTitle } from "src/components/ui/card";

export const SettingsSignOut = () => {
  const { signOut } = useAuth();

  const onClick = useCallback(async (): Promise<void> => {
    await wrapAsync(signOut);
  }, [signOut]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 py-4">
        <CardTitle className="text-base">Sign Out</CardTitle>
        <Button onClick={onClick}>Sign Out</Button>
      </CardHeader>
    </Card>
  );
};
