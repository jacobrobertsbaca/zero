import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from "@mui/material"
import { FormikValues, useFormikContext } from "formik"
import { get, max } from "lodash";

export type TextFieldProps = MuiTextFieldProps & {
  name: string;
  max?: number;
};

export const TextField = <T extends FormikValues>(props: TextFieldProps): JSX.Element => {
  const { name, inputProps, ...rest } = props;
  const formik = useFormikContext<T>();
  const error = get(formik.touched, name) && get(formik.errors, name);
  const errorText = typeof error === "string" ? error : JSON.stringify(error);
  
  const helperText = (() => {
    if (error) return errorText;
    if (props.max) return `${(get(formik.values, name) as string).length}/${props.max}`;
    return "";
  })();

  return <MuiTextField 
    error={!!error}
    helperText={helperText}
    onBlur={formik.handleBlur}
    onChange={formik.handleChange}
    value={get(formik.values, name)}
    name={name}
    inputProps={{
      maxLength: props.max,
      ...inputProps
    }}
    {...rest}
  />;
};