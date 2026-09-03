import { Trash2, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { SubmitButton } from "../form/submit-button";
import { Button, ButtonProps } from "src/components/ui/button";
import { useIsMobile } from "src/hooks/use-mobile";
import { cn } from "src/utils";
import { useSidebarFooter } from "./sidebar";

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
  const [deleting, setDeleting] = useState(false);
  const footer = useSidebarFooter();
  const mobile = useIsMobile();
  const size = mobile ? "default" : "sm";

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (err: any) {
      toast.error(err.message);
    }
    setDeleting(false);
  }, [onDelete]);

  const actions = (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t bg-background py-3 px-5 max-md:[&>button]:flex-1",
        className
      )}
      {...divProps}
    >
      {state === EditState.View && (
        <Button type="button" variant="outline" size={size} onClick={() => onStateChanged?.(EditState.Edit)}>
          Edit
        </Button>
      )}
      {state === EditState.Edit && (
        <>
          {onDelete && (
            <Button
              type="button"
              variant="outline"
              size={size}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              {...deleteProps}
              disabled={deleting || deleteProps?.disabled}
              onClick={handleDelete}
            >
              {deleting ? <Loader2 className="animate-spin" /> : deleteProps?.children ? null : <Trash2 />}
              {deleteProps?.children ?? "Delete"}
            </Button>
          )}
          <SubmitButton size={size} disabled={!dirty} {...submitProps}>
            {submitProps?.children ?? "Save"}
          </SubmitButton>
        </>
      )}
    </div>
  );

  if (footer.el) return createPortal(actions, footer.el);
  return actions;
};
