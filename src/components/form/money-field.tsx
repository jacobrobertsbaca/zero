import { InputAdornment, TextField, TextFieldProps } from "@mui/material";
import { FormikValues, useFormikContext } from "formik";
import { isEqual } from "lodash";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { moneyFormat, moneyParse } from "src/types/money/methods";
import { Money } from "src/types/money/types";

const maskCurrency = (prev: string, current: string): string => {
  current = current.replace(/[^0-9.-]/g, ""); // Remove non-numeric, non-period, non-dash characters
  const parts = current.split(".");
  const periods = parts.length - 1;
  const dashes = current.split("-").length - 1;
  if (dashes > 1) return prev;
  if (dashes == 1 && current[0] != "-") return prev;
  if (periods > 1) return prev;
  if (parts[1] && parts[1].length > 2) return prev;
  return current;
};

export type MoneyFieldProps = Omit<TextFieldProps, "value" | "onChange"> & {
  value: Money | null;
  onChange: (value: Money | null) => void;
};

export const MoneyField = (props: MoneyFieldProps) => {
  const { value, onChange, onBlur, ...rest } = props;
  const { InputProps, inputProps, ...TextFieldProps } = rest;

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
    (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>) => {
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
    <TextField
      InputProps={{
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
        ...InputProps,
      }}
      inputProps={{
        inputMode: "decimal",
        ...inputProps,
      }}
      onChange={onInputChange}
      onBlur={onInputBlur}
      value={rawInput}
      {...TextFieldProps}
    />
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
    (value: Money | null) => {
      formik.setFieldValue(name, value);
      onChange?.(value);
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
