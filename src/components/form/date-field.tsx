import { DatePicker, DatePickerProps } from "@mui/x-date-pickers";
import { FormikValues, useFormikContext } from "formik";
import { get } from "lodash";
import { asDate } from "src/types/utils/methods";

type DateFieldProps = DatePickerProps<Date> & {
  name: string;
};

export const DateField = <T extends FormikValues>(props: DateFieldProps) => {
  const { name } = props;
  const formik = useFormikContext<T>();
  const error = get(formik.touched, name) && get(formik.errors, name);
  return <DatePicker 
    slotProps={{
      textField: {
        onBlur: formik.handleBlur,
        helperText: typeof error === "string" ? error : JSON.stringify(error)
      }
    }}
    onChange={formik.handleChange}
    value={asDate(get(formik.values, name))}
    {...props}
  />;
};