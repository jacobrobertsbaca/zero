import { DatePicker, DatePickerProps } from "@mui/x-date-pickers";
import { FormikValues, useFormikContext } from "formik";
import { get } from "lodash";
import { useCallback } from "react";
import { asDate, asDateString } from "src/types/utils/methods";

type DateFieldProps = DatePickerProps<Date> & {
  name: string;
};

export const DateField = <T extends FormikValues>(props: DateFieldProps) => {
  const { name } = props;
  const { touched, errors, values, setFieldValue, setFieldTouched } = useFormikContext<T>();
  const error = get(touched, name) && get(errors, name);

  const onChange = useCallback(
    (value: Date | null) => {
      setFieldTouched(name);
      if (!value) setFieldValue(name, null);
      else if (value instanceof Date && isFinite(value.valueOf())) setFieldValue(name, asDateString(value));
      else setFieldValue(name, null);
    },
    [name, setFieldValue, setFieldTouched]
  );

  const value = useCallback(() => {
    const raw = get(values, name);
    if (!raw) return raw;
    return asDate(raw);
  }, [values, name]);

  return (
    <DatePicker
      slotProps={{
        textField: {
          onBlur: () => setFieldTouched(name),
          error: !!error,
          helperText: typeof error === "string" ? error : JSON.stringify(error),
        },
      }}
      onChange={onChange}
      value={value()}
      {...props}
    />
  );
};
