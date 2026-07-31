import { useFormikContext } from "formik";
import { Loader2 } from "lucide-react";
import { Button, ButtonProps } from "src/components/ui/button";

export const SubmitButton = ({
  disableIfInvalid,
  children,
  disabled,
  ...props
}: { disableIfInvalid?: boolean } & ButtonProps) => {
  const { isSubmitting, isValid } = useFormikContext();
  return (
    <Button type="submit" disabled={disabled || isSubmitting || (disableIfInvalid && !isValid)} {...props}>
      {isSubmitting && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  );
};
