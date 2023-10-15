import { styled } from "@mui/material";
import { Formik, FormikConfig, FormikProps, FormikValues } from "formik";
import { produce } from "immer";
import { useSnackbar } from "notistack";
import { ComponentProps } from "react";

type PropTypes<T> = {
  children: React.ReactNode | ((props: FormikProps<T>) => React.ReactNode);
};

const Form = styled("form")``;

export const useForm = <T extends FormikValues>(config: FormikConfig<T>) => {
  const { enqueueSnackbar } = useSnackbar();
  const { onSubmit } = config;

  /* Modify onSubmit to show snackbar errors */
  config = produce(config, (draft) => {
    draft.onSubmit = async (values, helpers) => {
      try {
        await onSubmit(values, helpers);
      } catch (err: any) {
        enqueueSnackbar(err.message, { variant: "error" });
        helpers.setStatus({ success: false });
      }
      helpers.setSubmitting(false);
    };
  });

  return ({ children, ...props }: PropTypes<T> & Omit<ComponentProps<typeof Form>, "children">) => (
    <Formik {...config}>
      {(formik) => (
        <Form onSubmit={formik.handleSubmit} {...props}>
          {typeof children === "function" ? children(formik) : children}
        </Form>
      )}
    </Formik>
  );
};
