import { InputAdornment } from "@mui/material";
import { FormikValues, useFormikContext } from "formik";
import { get } from "lodash";
import { ChangeEvent, useCallback, useState } from "react";
import { moneyFormat } from "src/types/money/methods";
import { TextField, TextFieldProps } from "./text-field";

export const MoneyField = <T extends FormikValues>(props: TextFieldProps) => {
  const { name } = props;
  const formik = useFormikContext<T>();
  const money = formik.values
  return (
    <TextField
      InputProps={{
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
        inputMode: "numeric",
        pattern: "[0-9.]*",
      }}
      onChange={undefined}
      value={moneyFormat(get(formik.values, name), { excludeSymbol: true })}
      {...props}
    />
  );
};
