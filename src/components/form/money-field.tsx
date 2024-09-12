import { InputAdornment, TextField, TextFieldProps } from "@mui/material";
import { FormikValues, useFormikContext } from "formik";
import { get, isEqual } from "lodash";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { defaultCurrency, moneyFormat, moneyZero } from "src/types/money/methods";
import { Money } from "src/types/money/types";

type MoneyFieldProps = Omit<TextFieldProps, "value" | "onChange"> &
  (
    | {
        name?: undefined;
        value: Money | null;
        onChange: (value: Money) => void;
      }
    | {
        name: string;
        value?: undefined;
        onChange?: undefined;
      }
  );

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

const parseCurrency = (input: string): Money => {
  if (input === "" || input === ".") return moneyZero();
  const negative = input[0] === "-";
  if (negative) input = input.slice(1);
  const parts = input.split(".");
  let major = parseInt(parts[0]);
  let minor = parseInt(parts[1]);
  if (parts[1] && parts[1].length === 1) minor *= 10;
  if (isNaN(major) && isNaN(minor)) return moneyZero();
  major = isNaN(major) ? 0 : major;
  minor = isNaN(minor) ? 0 : minor;
  return {
    amount: (negative ? -1 : 1) * (100 * major + minor),
    currency: defaultCurrency,
  };
};

export const MoneyField = <T extends FormikValues>(props: MoneyFieldProps) => {
  const { name, value, onChange, ...rest } = props;
  const formik = useFormikContext<T>();
  const current = value !== undefined ? value : (get(formik.values, name) as Money);
  const [raw, setRaw] = useState(current ? moneyFormat(current, { excludeSymbol: true }) : "");

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setRaw(maskCurrency(raw, event.target.value));
    },
    [raw]
  );

  const handleBlur = useCallback(() => {
    const money = parseCurrency(raw);
    if (current) setRaw(moneyFormat(current, { excludeSymbol: true }));
    if (isEqual(money, current)) return;
    if (onChange) onChange(money);
    else formik.setFieldValue(name, money);
  }, [formik, name, onChange, raw, current]);

  useEffect(() => {
    setRaw(current ? moneyFormat(current, { excludeSymbol: true }) : "");
  }, [current]);

  const { InputProps, inputProps, ...textFieldProps } = rest;
  const error = name ? get(formik.touched, name) && get(formik.errors, name) : "";

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
      error={!!error}
      helperText={typeof error === "string" ? error : JSON.stringify(error)}
      value={raw}
      onChange={handleChange}
      onBlur={handleBlur}
      {...textFieldProps}
    />
  );
};

const parseCurrencyV2 = (input: string): Money | null => {
  if (input === "" || input === ".") return null;
  const negative = input[0] === "-";
  if (negative) input = input.slice(1);
  const parts = input.split(".");
  let major = parseInt(parts[0]);
  let minor = parseInt(parts[1]);
  if (parts[1] && parts[1].length === 1) minor *= 10;
  if (isNaN(major) && isNaN(minor)) return null;
  major = isNaN(major) ? 0 : major;
  minor = isNaN(minor) ? 0 : minor;
  return {
    amount: (negative ? -1 : 1) * (100 * major + minor),
    currency: defaultCurrency,
  };
};

export type MoneyFieldPropsV2 = Omit<TextFieldProps, "value" | "onChange"> & {
  value: Money | null;
  onChange: (value: Money | null) => void;
};

export const MoneyFieldV2 = (props: MoneyFieldPropsV2) => {
  const { value, onChange, ...rest } = props;
  const [rawInput, setRawInput] = useState("");
  const lastValue = useRef(value);

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRawInput((prevInput) => maskCurrency(prevInput, event.target.value));
    const money = parseCurrencyV2(event.target.value);
    lastValue.current = money;
    onChange(money);
    console.log("raw: ", event.target.value, " money: ", money);
  };

  useEffect(() => {
    if (isEqual(value, lastValue.current)) return;
    if (value === null) setRawInput("");
    else setRawInput(moneyFormat(value, { excludeSymbol: true }));
    lastValue.current = value;
    console.log("effect value: ", value);
  }, [value]);

  return <TextField onChange={onInputChange} value={rawInput} {...rest} />;
};
