import { styled } from "@mui/material";
import { Formik, FormikConfig, FormikHelpers, FormikValues } from "formik";
import { ComponentProps, useCallback } from "react";
import { wrapAsync } from "src/utils/wrap-errors";

const StyledForm = styled("form")``;

export type FormProps<T> = FormikConfig<T> & Omit<ComponentProps<typeof StyledForm>, "children" | "onSubmit">;

export const Form = <T extends FormikValues>(props: FormProps<T>) => {
  const { onSubmit, children, ...rest } = props; 

  const handleSubmit = useCallback(
    async (values: T, helpers: FormikHelpers<T>) => {
      await wrapAsync(
        async () => await onSubmit(values, helpers),
        () => helpers.setStatus({ success: false })
      );
      helpers.setSubmitting(false);
    },
    [onSubmit]
  );

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
