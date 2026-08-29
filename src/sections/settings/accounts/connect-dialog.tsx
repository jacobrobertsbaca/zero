import { ChevronRight, Ellipsis, Landmark, Lock, type LucideIcon } from "lucide-react";
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
import { Spinner } from "src/components/ui/spinner";
import { cn } from "src/utils";

type Props = {
  open: boolean;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

const info: { icon: LucideIcon; text: string }[] = [
  {
    icon: Landmark,
    text: "Securely link a bank account to begin syncing transactions.",
  },
  {
    icon: Lock,
    text: "We use Plaid to connect to your account, with bank-level encryption to keep your data safe.",
  },
];

export function ConnectDialog({ open, loading, onOpenChange, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect an external account</DialogTitle>
          <DialogDescription className="sr-only">
            Connect through Plaid to start syncing transactions.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="gap-3">
          <ul className="overflow-hidden rounded-sm border border-border/60 bg-gradient-to-b from-muted/35 to-muted/10">
            {info.map(({ icon: Icon, text }, index) => (
              <li
                key={text}
                className={cn("flex items-center gap-3 px-3 py-3", index > 0 && "border-t border-border/50")}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted border">
                  <Icon className="size-3 text-foreground" strokeWidth={1.75} />
                </span>
                <span className="text-xs leading-snug text-foreground/85">{text}</span>
              </li>
            ))}
          </ul>

          <p className="rounded-lg text-xs leading-relaxed ">
            To change what accounts are shared for an existing institution, click{" "}
            <span className="font-medium">
              <Ellipsis className="inline" size="1em" />
              <ChevronRight className="inline" size="1em" />
              Manage
            </span>{" "}
            for that institution. See our{" "}
            <a href="#" className="font-medium text-primary underline-offset-4 hover:underline">
              privacy policy
            </a>{" "}
            for more on how we use your information.
          </p>
        </DialogBody>

        <DialogFooter>
          <Button className="w-full" variant="outline" size="sm" onClick={onConfirm} disabled={loading}>
            {loading ? <Spinner className="size-4" /> : "Connect with Plaid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
