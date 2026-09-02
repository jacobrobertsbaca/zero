import { Formik, FormikConfig, FormikHelpers, FormikValues } from "formik";
import { ComponentProps, useCallback } from "react";
import { wrapAsync } from "src/utils/wrap-errors";

export type FormProps<T> = FormikConfig<T> & Omit<ComponentProps<"form">, "children" | "onSubmit">;

export const Form = <T extends FormikValues>(props: FormProps<T>) => {
  const { onSubmit, children, className, ...rest } = props;

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
        <form onSubmit={formik.handleSubmit} className={className} noValidate>
          {typeof children === "function" ? children(formik) : children}
        </form>
      )}
    </Formik>
  );
};
