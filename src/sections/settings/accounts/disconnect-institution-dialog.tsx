import { useCallback, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "src/components/ui/alert-dialog";
import { Spinner } from "src/components/ui/spinner";
import { InstitutionConnectionCard } from "src/sections/settings/accounts/institution-connection-card";
import type { PlaidConnection } from "src/types/plaid/types";
import { wrapAsync } from "src/utils/wrap-errors";

type Props = {
  connection: PlaidConnection | null;
  onClose: () => void;
  onDisconnect: () => Promise<void>;
};

export function DisconnectInstitutionDialog({ connection, onClose, onDisconnect }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDisconnect = useCallback(async () => {
    setLoading(true);
    await wrapAsync(async () => {
      await onDisconnect();
      onClose();
    });
    setLoading(false);
  }, [onClose, onDisconnect]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !loading) onClose();
    },
    [loading, onClose]
  );

  return (
    <AlertDialog open={connection !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        {connection && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect {connection.institutionName}?</AlertDialogTitle>
            </AlertDialogHeader>

            <div className="space-y-3 px-4 pb-3">
              <AlertDialogDescription>
                This permanently removes your connection to {connection.institutionName}. Transactions already synced
                will not be deleted, but they will no longer be associated with this institution. This cannot be undone.
              </AlertDialogDescription>

              <InstitutionConnectionCard
                institutionName={connection.institutionName}
                institutionLogo={connection.institutionLogo}
                createdAt={connection.createdAt}
                accountCount={connection.accounts.length}
              />
            </div>

            <AlertDialogFooter>
              {!loading && <AlertDialogCancel>Cancel</AlertDialogCancel>}
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  void handleDisconnect();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={loading}
              >
                {loading ? <Spinner className="size-4" /> : "Disconnect"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
