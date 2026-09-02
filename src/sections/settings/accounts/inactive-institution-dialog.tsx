import { ChevronRight, Ellipsis, Info, Plus } from "lucide-react";
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

type Props = {
  open: boolean;
  institutionName: string;
  onOpenChange: (open: boolean) => void;
};

export function InactiveInstitutionDialog({ open, institutionName, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="size-4 text-muted-foreground" />
            {institutionName} is inactive
          </DialogTitle>
        </DialogHeader>

        <DialogBody>
          <DialogDescription asChild>
            <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                Syncing for this institution was paused when your Plus subscription ended, but your account history has
                been kept so that you can reconnect with a valid subscription.
              </p>
              <p>
                To resume syncing, ensure you have a valid subscription and use{" "}
                <span className="font-semibold">
                  <Plus className="inline size-[1em]" /> Connect
                </span>{" "}
                to add {institutionName}&nbsp;again. Alternatively, to remove {institutionName} and all of its data, use{" "}
                <span className="font-medium">
                  <Ellipsis className="size-[1em] inline" />
                  <ChevronRight className="inline" size="1em" />
                  <span className="text-destructive">Disconnect</span>
                </span>{" "}
                in the list of institutions.
              </p>
            </div>
          </DialogDescription>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
