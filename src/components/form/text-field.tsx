import { FormikValues, useFormikContext } from "formik";
import { get } from "lodash";
import { InputHTMLAttributes } from "react";
import { Field } from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { Textarea } from "src/components/ui/textarea";
import { cn } from "src/lib/utils";

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, "name"> & {
  name: string;
  label?: React.ReactNode;
  max?: number;
  multiline?: boolean;
  rows?: number;
  fullWidth?: boolean;
  helperText?: React.ReactNode;
};

export const TextField = <T extends FormikValues>(props: TextFieldProps): JSX.Element => {
  const { name, label, max, multiline, rows, className, fullWidth, helperText: helperTextProp, ...rest } = props;
  const formik = useFormikContext<T>();
  const error = get(formik.touched, name) && get(formik.errors, name);
  const errorText = typeof error === "string" ? error : error ? JSON.stringify(error) : undefined;

  const helperText = (() => {
    if (error) return errorText;
    if (max) return `${(get(formik.values, name) as string)?.length ?? 0}/${max}`;
    return helperTextProp;
  })();

  const shared = {
    id: name,
    name,
    value: get(formik.values, name) ?? "",
    onBlur: formik.handleBlur,
    onChange: formik.handleChange,
    maxLength: max,
    className: cn(fullWidth !== false && "w-full", error && "border-destructive", className),
    ...rest,
  };

  return (
    <Field label={label} htmlFor={name} error={!!error} helperText={helperText}>
      {multiline ? <Textarea rows={rows} {...(shared as any)} /> : <Input {...(shared as any)} />}
    </Field>
  );
};
