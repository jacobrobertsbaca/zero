import { Formik, FormikConfig, FormikProps, FormikValues } from "formik";
import { produce } from "immer";
import { useSnackbar } from "notistack";

type PropTypes<T> = {
  children: React.ReactNode | ((props: FormikProps<T>) => React.ReactNode);
};

export const useForm = <T extends FormikValues>(config: FormikConfig<T>) => {
  const { enqueueSnackbar } = useSnackbar();
  const { onSubmit } = config;

  /* Modify onSubmit to show snackbar errors */
  config = produce(config, draft => {
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

  return ({ children }: PropTypes<T>) => <Formik {...config}>
    {props => (
      <form onSubmit={props.handleSubmit}>
        {typeof children === 'function' ? children(props) : children}
      </form>
    )}
  </Formik>;
};