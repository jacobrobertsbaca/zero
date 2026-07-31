import { Trash2, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useSnackbar } from "notistack";
import { SubmitButton } from "../form/submit-button";
import { Button, ButtonProps } from "src/components/ui/button";
import { cn } from "src/lib/utils";

export enum EditState {
  View,
  Edit,
}

type EditActionsProps = React.HTMLAttributes<HTMLDivElement> & {
  dirty?: boolean;
  state: EditState;
  onStateChanged?: (state: EditState) => void;
  onDelete?: () => void | Promise<void>;
  ButtonProps?: {
    submit?: ButtonProps;
    delete?: ButtonProps;
  };
};

export const EditActions = (props: EditActionsProps) => {
  const { dirty, state, onStateChanged, onDelete, ButtonProps, className, ...divProps } = props;
  const { submit: submitProps, delete: deleteProps } = ButtonProps ?? {};
  const { enqueueSnackbar } = useSnackbar();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (err: any) {
      enqueueSnackbar(err.message, { variant: "error" });
    }
    setDeleting(false);
  }, [onDelete, enqueueSnackbar]);

  return (
    <div className={cn("flex flex-col gap-2", className)} {...divProps}>
      {state === EditState.View && (
        <Button type="button" variant="outline" onClick={() => onStateChanged?.(EditState.Edit)}>
          Edit
        </Button>
      )}
      {state === EditState.Edit && (
        <>
          <SubmitButton variant="outline" disabled={!dirty} {...submitProps}>
            {submitProps?.children ?? "Save"}
          </SubmitButton>
          {onDelete && (
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              {...deleteProps}
              disabled={deleting || deleteProps?.disabled}
              onClick={handleDelete}
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : deleteProps?.children ? null : (
                <Trash2 className="size-4" />
              )}
              {deleteProps?.children ?? "Delete"}
            </Button>
          )}
        </>
      )}
    </div>
  );
};
