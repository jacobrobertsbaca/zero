import { Button, Card, CardHeader } from "@mui/material";
import { useCallback } from "react";
import { useAuth } from "src/hooks/use-auth";
import { wrapAsync } from "src/utils/wrap-errors";

export const SettingsSignOut = () => {
  const { signOut } = useAuth();

  const onClick = useCallback(async (): Promise<void> => {
    await wrapAsync(signOut);
  }, [signOut]);

  return (
    <Card sx={{ pb: 2 }}>
      <CardHeader
        title="Sign Out"
        action={
          <Button variant="contained" onClick={onClick}>
            Sign Out
          </Button>
        }
      />
    </Card>
  );
};
