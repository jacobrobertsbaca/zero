import { Button, Card, CardContent, CardHeader } from "@mui/material";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { useCallback } from "react";
import { useAuth } from "src/hooks/use-auth";

export const SettingsSignOut = () => {
  const { signOut } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();

  const onClick = useCallback(async (): Promise<void> => {
    try {
      await signOut();
      router.push("/");
    } catch (err: any) {
      enqueueSnackbar(err.message, { variant: "error" });
    }
  }, [enqueueSnackbar, router, signOut]);

  return <Card sx={{ pb: 2 }}>
    <CardHeader 
      title="Sign Out"
      action={
        <Button variant="contained" onClick={onClick}>Sign Out</Button>
      }
    />
  </Card>
};