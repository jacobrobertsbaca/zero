import { FormikValues, useFormikContext } from "formik";
import { get } from "lodash";
import { Field } from "src/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select";
import { cn } from "src/utils";

type SelectOption = {
  value: string | number | undefined;
  label: React.ReactNode;
  /** Plain text for SelectValue when label is a ReactNode */
  textValue?: string;
};

type PropTypes = {
  name: string;
  values: SelectOption[];
  label?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  helperText?: React.ReactNode;
  /** Overrides the default formik field update. Receives an event-like object for parity with native selects. */
  onChange?: (event: { target: { value: string } }) => void;
};

export const SelectField = <T extends FormikValues>(props: PropTypes) => {
  const { name, values, label, fullWidth, className, disabled, helperText, onChange } = props;
  const formik = useFormikContext<T>();
  const error = get(formik.touched, name) && get(formik.errors, name);
  const errorText = typeof error === "string" ? error : error ? JSON.stringify(error) : undefined;
  const current = get(formik.values, name);
  const stringValue = current === undefined || current === null ? "" : String(current);

  const selected = values.find((v) => String(v.value) === stringValue);

  return (
    <Field label={label} htmlFor={name} error={!!error} helperText={errorText ?? helperText} className={className}>
      <Select
        value={stringValue || undefined}
        disabled={disabled}
        onValueChange={(value) => {
          if (onChange) {
            onChange({ target: { value } });
            return;
          }
          const option = values.find((v) => String(v.value) === value);
          formik.setFieldValue(name, option?.value);
        }}
        onOpenChange={(open) => {
          if (!open) formik.setFieldTouched(name, true);
        }}
      >
        <SelectTrigger id={name} className={cn(fullWidth !== false && "w-full", error && "border-destructive")}>
          <SelectValue placeholder="Select…">
            {selected
              ? selected.textValue ?? (typeof selected.label === "string" ? selected.label : stringValue)
              : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[225px]">
          {values.map((v) => (
            <SelectItem key={String(v.value)} value={String(v.value)} textValue={v.textValue ?? String(v.value)}>
              {v.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
};
