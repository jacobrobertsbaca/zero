import { FormikValues, useFormikContext } from "formik";
import { isEqual } from "lodash";
import { ChangeEvent, InputHTMLAttributes, useCallback, useEffect, useRef, useState } from "react";
import { Field } from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { cn } from "src/lib/utils";
import { moneyFormat, moneyParse } from "src/types/money/methods";
import { Money } from "src/types/money/types";

const maskCurrency = (prev: string, current: string): string => {
  current = current.replace(/[^0-9.-]/g, "");
  const parts = current.split(".");
  const periods = parts.length - 1;
  const dashes = current.split("-").length - 1;
  if (dashes > 1) return prev;
  if (dashes == 1 && current[0] != "-") return prev;
  if (periods > 1) return prev;
  if (parts[1] && parts[1].length > 2) return prev;
  return current;
};

export type MoneyFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size"> & {
  value: Money | null;
  onChange: (value: Money | null) => void;
  label?: React.ReactNode;
  error?: boolean;
  helperText?: React.ReactNode;
  fullWidth?: boolean;
};

export const MoneyField = (props: MoneyFieldProps) => {
  const { value, onChange, onBlur, label, error, helperText, className, fullWidth, id, name, ...rest } = props;
  const [rawInput, setRawInput] = useState("");
  const lastValue = useRef<Money | null>();

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setRawInput((prevInput) => maskCurrency(prevInput, event.target.value));
      const money = moneyParse(event.target.value);
      lastValue.current = money;
      onChange(money);
    },
    [onChange]
  );

  const onInputBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      if (value) setRawInput(moneyFormat(value, { keepZero: true, excludeSymbol: true }));
      else setRawInput("");
      onBlur?.(event);
    },
    [value, onBlur]
  );

  useEffect(() => {
    if (isEqual(value, lastValue.current)) return;
    if (value === null) setRawInput("");
    else setRawInput(moneyFormat(value, { keepZero: true, excludeSymbol: true }));
    lastValue.current = value;
  }, [value]);

  return (
    <Field label={label} htmlFor={id ?? name} error={error} helperText={helperText}>
      <div className={cn("relative", fullWidth !== false && "w-full")}>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          $
        </span>
        <Input
          id={id ?? name}
          name={name}
          inputMode="decimal"
          autoComplete="off"
          onChange={onInputChange}
          onBlur={onInputBlur}
          value={rawInput}
          className={cn("pl-7", error && "border-destructive", className)}
          {...rest}
        />
      </div>
    </Field>
  );
};

export type FormMoneyFieldProps = Omit<MoneyFieldProps, "value" | "onChange" | "name"> & {
  name: string;
  onChange?: (value: Money | null) => void;
  value?: Money | null;
};

export const FormMoneyField = <T extends FormikValues>(props: FormMoneyFieldProps) => {
  const { name, onChange, value, helperText, ...rest } = props;
  const formik = useFormikContext<T>();
  const formMeta = formik.getFieldMeta(name);
  const formValue = (value ?? formMeta.value) as Money | null;
  const formError = (formMeta.touched && formMeta.error) || undefined;

  const onFieldChange = useCallback(
    (next: Money | null) => {
      formik.setFieldValue(name, next);
      onChange?.(next);
    },
    [formik, name, onChange]
  );

  return (
    <MoneyField
      name={name}
      value={formValue}
      onChange={onFieldChange}
      error={!!formError}
      helperText={formError ?? helperText}
      onBlur={formik.handleBlur}
      {...rest}
    />
  );
};
