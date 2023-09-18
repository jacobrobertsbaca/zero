import { TextField as MuiTextField, TextFieldProps } from "@mui/material"
import { FormikValues, useFormikContext } from "formik"

type PropTypes<T extends FormikValues> = TextFieldProps & {
  name: keyof T;
};

export const TextField = <T extends FormikValues>(props: PropTypes<T>): JSX.Element => {
  const { name } = props;
  const formik = useFormikContext<T>();
  const error = formik.touched[name] && formik.errors[name]
  console.log(error);
  return <MuiTextField 
    error={!!error}
    helperText={typeof error === "string" ? error : JSON.stringify(error)}
    onBlur={formik.handleBlur}
    onChange={formik.handleChange}
    value={formik.values[name]}
    {...props}
  />;
};