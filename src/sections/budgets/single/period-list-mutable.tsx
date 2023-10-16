import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { FormikProps } from "formik";
import { ChangeEvent, useCallback } from "react";
import { SelectField } from "src/components/form/select-field";
import { MoneyText } from "src/components/money-text";
import { onPeriodTruncate, periodDatesFormat } from "src/types/category/methods";
import { Category, Period, TruncateMode } from "src/types/category/types";
import { datesDays } from "src/types/utils/methods";

type PeriodListMutableProps = {
  form: FormikProps<Category>;
};

export const PeriodListMutable = ({ form }: PeriodListMutableProps) => {
  const getValues = useCallback((period: Period) => {
    const values = [
      { value: TruncateMode.Omit, label: "Omit" },
      { value: TruncateMode.Keep, label: "Keep" },
    ];
    if (datesDays(period.dates) != period.days) values.push({ value: TruncateMode.Split, label: "Split" });
    return values;
  }, []);

  const onPeriodTruncateChanged = useCallback(
    (index: number, event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const truncate = event.target.value as TruncateMode;
      form.setFieldValue(`periods[${index}]`, onPeriodTruncate(form.values, form.values.periods[index], truncate));
    },
    [form]
  );

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Periods ({form.values.periods.length - 2})</TableCell>
          <TableCell>Options</TableCell>
          <TableCell>Amount</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {form.values.periods.map((period, index) => {
          if (index === 0 || index === form.values.periods.length - 1) return null;
          return (
            <TableRow hover key={`${period.dates.begin}${period.dates.end}`}>
              <TableCell>{periodDatesFormat(period)}</TableCell>
              <TableCell>
                <SelectField
                  variant="standard"
                  name={`periods[${index}].truncate`}
                  values={getValues(period)}
                  onChange={(event) => onPeriodTruncateChanged(index, event)}
                />
              </TableCell>
              <TableCell>
                <MoneyText amount={period.nominal} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
