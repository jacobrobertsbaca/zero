import { InputAdornment, TextField, TextFieldProps } from "@mui/material";
import { FormikValues, useFormikContext } from "formik";
import { get } from "lodash";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { defaultCurrency, moneyFormat, moneyZero } from "src/types/money/methods";
import { Money } from "src/types/money/types";

type MoneyFieldProps = Omit<TextFieldProps, "value" | "onChange"> &
  (
    | {
        name?: undefined;
        value: Money;
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

const parseCurrency = (input: string): Money | undefined => {
  if (input === "" || input === "." || input === "-.") return moneyZero();
  const negative = input[0] === "-";
  if (negative) input = input.slice(1);
  console.log(input);
  const parts = input.split(".");
  let major = parseInt(parts[0]);
  let minor = parseInt(parts[1]);
  if (parts[1] && parts[1].length === 1) minor *= 10;
  if (isNaN(major) && isNaN(minor)) return;
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
  const current = value ?? (get(formik.values, name) as Money);
  const [raw, setRaw] = useState(moneyFormat(current, { excludeSymbol: true }));

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const current = maskCurrency(raw, event.currentTarget.value);
      setRaw(current);
      let money = parseCurrency(current);
      if (money) {
        if (onChange) onChange(money);
        else formik.setFieldValue(name, money);
      }
    },
    [formik, name, onChange, raw]
  );

  const handleBlur = useCallback(() => {
    setRaw(moneyFormat(current, { excludeSymbol: true }));
  }, [current]);

  return (
    <TextField
      inputProps={{
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
        inputMode: "numeric",
        pattern: "[0-9.]*",
      }}
      value={raw}
      onChange={handleChange}
      onBlur={handleBlur}
      {...rest}
    />
  );
};
