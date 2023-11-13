import { Button, Card, CardHeader } from "@mui/material";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { useAuth } from "src/hooks/use-auth";
import { wrapAsync } from "src/utils/wrap-errors";

export const SettingsSignOut = () => {
  const { signOut } = useAuth();
  const router = useRouter();

  const onClick = useCallback(async (): Promise<void> => {
    await wrapAsync(async () => {
      await signOut();
      router.push("/");
    });
  }, [router, signOut]);

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
