import { useEffect, useState } from "react";
import { Button } from "src/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "src/components/ui/dialog";
import { InstitutionConnectionCard } from "src/sections/settings/accounts/institution-connection-card";
import { cn } from "src/utils";
import type { PlaidConnection } from "src/types/plaid/types";

type Props = {
  open: boolean;
  institutionName: string;
  connections: PlaidConnection[];
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (connectionId: string) => void;
};

export function ReviveInstitutionDialog({
  open,
  institutionName,
  connections,
  loading,
  onCancel,
  onConfirm,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      return;
    }
    setSelectedId(connections.length === 1 ? connections[0]!.id : null);
  }, [open, connections]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !loading) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restore a prior {institutionName} connection?</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <DialogDescription>
            You previously connected {institutionName}. Choose which inactive connection to restore so accounts and
            synced history stay linked.
          </DialogDescription>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Inactive connections
            </p>
            <ul className="space-y-2">
              {connections.map((connection) => {
                const selected = selectedId === connection.id;
                return (
                  <li key={connection.id}>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setSelectedId(connection.id)}
                      className={cn(
                        "w-full rounded-md text-left transition-colors",
                        selected ? "ring-2 ring-ring" : "hover:bg-muted/40"
                      )}
                    >
                      <InstitutionConnectionCard
                        institutionName={connection.institutionName}
                        institutionLogo={connection.institutionLogo}
                        createdAt={connection.createdAt}
                        accountCount={connection.accounts.length}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={loading || !selectedId}
            onClick={() => {
              if (selectedId) onConfirm(selectedId);
            }}
          >
            Restore
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
