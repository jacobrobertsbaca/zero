import { styled } from "@mui/material";
import { Formik, FormikConfig, FormikHelpers, FormikProps, FormikValues } from "formik";
import { produce } from "immer";
import { useSnackbar } from "notistack";
import { ComponentProps, useCallback } from "react";

const StyledForm = styled("form")``;

type PropTypes<T> = FormikConfig<T> & Omit<ComponentProps<typeof StyledForm>, "children" | "onSubmit">;

export const Form = <T extends FormikValues>(props: PropTypes<T>) => {
  const { enqueueSnackbar } = useSnackbar();
  const { onSubmit, children, ...rest } = props; 

  const handleSubmit = useCallback(async (values: T, helpers: FormikHelpers<T>) => {
    try {
      await onSubmit(values, helpers);
    } catch (err: any) {
      enqueueSnackbar(err.message, { variant: "error" });
      helpers.setStatus({ success: false });
    }
    helpers.setSubmitting(false);
  }, [onSubmit, enqueueSnackbar]);

  return (
    <Formik onSubmit={handleSubmit} {...rest}>
      {(formik) => (
        <StyledForm onSubmit={formik.handleSubmit} {...rest}>
          {typeof children === "function" ? children(formik) : children}
        </StyledForm>
      )}
    </Formik>
  );
};
