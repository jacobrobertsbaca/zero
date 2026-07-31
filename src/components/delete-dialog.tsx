import React, { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { wrapAsync } from "src/utils/wrap-errors";
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

type DeleteDialogProps = {
  open: boolean;
  title: React.ReactNode;
  desc?: React.ReactNode;
  onClose: () => void;
  onDelete: () => Promise<void> | void;
};

export const DeleteDialog = ({ open, title, desc, onClose, onDelete }: DeleteDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = useCallback(async () => {
    setLoading(true);
    await wrapAsync(async () => {
      await onDelete();
      onClose();
    });
    setLoading(false);
  }, [onDelete, onClose]);

  const handleClose = useCallback(
    (next: boolean) => {
      if (!next && loading) return;
      if (!next) onClose();
    },
    [loading, onClose]
  );

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {desc ? <AlertDialogDescription>{desc}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!loading && <AlertDialogCancel>Cancel</AlertDialogCancel>}
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={loading}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
