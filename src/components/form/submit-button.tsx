import { LoadingButton, LoadingButtonProps } from "@mui/lab";
import { useFormikContext } from "formik";

export const SubmitButton = (props: { disableIfInvalid?: boolean } & LoadingButtonProps) => {
  const { disableIfInvalid, children } = props;
  const { isSubmitting, isValid } = useFormikContext();
  return <LoadingButton 
    variant="contained"
    type="submit"
    loading={isSubmitting}
    disabled={disableIfInvalid && !isValid}
    {...props}
  >
    {
      /* Wrapping strings in <span/> to prevent Chrome crash.
       * See MUI docs: https://mui.com/material-ui/react-button/#loading-button */
      typeof children === "string" ? <span>{children}</span> : children 
    }
  </LoadingButton>
};