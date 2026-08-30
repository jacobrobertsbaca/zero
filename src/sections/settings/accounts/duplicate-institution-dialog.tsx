import { ChevronRight, Ellipsis } from "lucide-react";
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
import type { PlaidConnection } from "src/types/plaid/types";

type Props = {
  open: boolean;
  institutionName: string;
  connections: PlaidConnection[];
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DuplicateInstitutionDialog({
  open,
  institutionName,
  connections,
  loading,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !loading) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure you want to connect {institutionName} again?</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <DialogDescription>
            Adding duplicate connections consumes an institution slot and may cause transactions to be duplicated. If
            you meant to update which accounts are shared for {institutionName}, click{" "}
            <span className="font-medium">
              <Ellipsis className="inline" size="1em" />
              <ChevronRight className="inline" size="1em" />
              Manage
            </span>{" "}
            on this institution.
          </DialogDescription>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Existing connections
            </p>
            <ul className="space-y-2">
              {connections.map((connection) => (
                <li key={connection.id}>
                  <InstitutionConnectionCard
                    institutionName={connection.institutionName}
                    institutionLogo={connection.institutionLogo}
                    createdAt={connection.createdAt}
                    accountCount={connection.accounts.length}
                  />
                </li>
              ))}
            </ul>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={loading}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
