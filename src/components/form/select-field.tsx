import { MenuItem, TextField, TextFieldProps } from "@mui/material";
import { FormikValues, useFormikContext } from "formik";
import { get } from "lodash";

type SelectValue = {
  value: string | number | undefined;
  label: React.ReactNode;
};

type PropTypes = TextFieldProps & {
  name: string;
  values: SelectValue[];
};

export const SelectField = <T extends FormikValues>(props: PropTypes): JSX.Element => {
  const { name, values, ...rest } = props;
  const formik = useFormikContext<T>();
  const error = get(formik.touched, name) && get(formik.errors, name);
  return (
    <TextField
      select
      error={!!error}
      helperText={typeof error === "string" ? error : JSON.stringify(error)}
      onBlur={formik.handleBlur}
      onChange={formik.handleChange}
      value={get(formik.values, name)}
      name={name}
      {...rest}
    >
      {values.map((v) => (
        <MenuItem key={v.value} value={v.value}>
          {v.label}
        </MenuItem>
      ))}
    </TextField>
  );
};
