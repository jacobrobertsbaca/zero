import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from "@mui/material"
import { FormikValues, useFormikContext } from "formik"
import { get } from "lodash";

export type TextFieldProps = MuiTextFieldProps & {
  name: string;
};

export const TextField = <T extends FormikValues>(props: TextFieldProps): JSX.Element => {
  const { name } = props;
  const formik = useFormikContext<T>();
  const error = get(formik.touched, name) && get(formik.errors, name);
  return <MuiTextField 
    error={!!error}
    helperText={typeof error === "string" ? error : JSON.stringify(error)}
    onBlur={formik.handleBlur}
    onChange={formik.handleChange}
    value={get(formik.values, name)}
    {...props}
  />;
};