import { Collapse, Table, TableBody, TableCell, TableFooter, TableHead, TableRow } from "@mui/material";
import { useFormikContext } from "formik";
import { ChangeEvent, useCallback } from "react";
import { SelectField } from "src/components/form/select-field";
import { MoneyText } from "src/components/money-text";
import { PaginatedOptions } from "src/components/table/paginated-options";
import { PaginatedRows } from "src/components/table/paginated-rows";
import { PaginatedTable } from "src/components/table/paginated-table";
import { onPeriodTruncate, periodDatesFormat } from "src/types/category/methods";
import { Category, Period, RecurrenceType, TruncateMode } from "src/types/category/types";
import { datesDays } from "src/types/utils/methods";

export const PeriodListMutable = () => {
  const form = useFormikContext<Category>();

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

  const show = form.values.recurrence.type !== RecurrenceType.None;
  const rows = form.values.periods.slice(1, form.values.periods.length - 1);

  return (
    <Collapse in={show} sx={{ mt: show ? undefined : "0 !important" }}>
      <PaginatedTable rows={rows} rowsPerPageOptions={[10]}>
        <TableHead>
          <TableRow>
            <TableCell>Periods ({form.values.periods.length - 2})</TableCell>
            <TableCell>Options</TableCell>
            <TableCell>Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <PaginatedRows>
            {(period: Period, index) => (
              <TableRow hover key={`${period.dates.begin}${period.dates.end}`}>
                <TableCell>{periodDatesFormat(period)}</TableCell>
                <TableCell>
                  <SelectField
                    variant="standard"
                    name={`periods[${index + 1}].truncate`} // +1 due to slice
                    values={getValues(period)}
                    onChange={(event) => onPeriodTruncateChanged(index, event)}
                  />
                </TableCell>
                <TableCell>
                  <MoneyText amount={period.nominal} />
                </TableCell>
              </TableRow>
            )}
          </PaginatedRows>
        </TableBody>
        <TableFooter>
          <TableRow>
            <PaginatedOptions colSpan={3} />
          </TableRow>
        </TableFooter>
      </PaginatedTable>
    </Collapse>
  );
};
