import { LoadingButton, LoadingButtonProps } from "@mui/lab";
import { useFormikContext } from "formik";

export const SubmitButton = (props: LoadingButtonProps) => {
  const { children } = props;
  const { isSubmitting } = useFormikContext();
  return <LoadingButton 
    variant="contained"
    type="submit"
    loading={isSubmitting}
    {...props}
  >
    {
      /* Wrapping strings in <span/> to prevent Chrome crash.
       * See MUI docs: https://mui.com/material-ui/react-button/#loading-button */
      typeof children === "string" ? <span>{children}</span> : children 
    }
  </LoadingButton>
};