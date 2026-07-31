import { useFormikContext } from "formik";
import { useCallback } from "react";
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
    (index: number, event: { target: { value: string } }) => {
      const truncate = event.target.value as TruncateMode;
      form.setFieldValue(`periods[${index}]`, onPeriodTruncate(form.values, form.values.periods[index], truncate));
    },
    [form]
  );

  const show = form.values.recurrence.type !== RecurrenceType.None;
  const rows = form.values.periods.slice(1, form.values.periods.length - 1);

  if (!show) return null;

  return (
    <PaginatedTable rows={rows} rowsPerPageOptions={[10]}>
      <thead>
        <tr className="border-b text-left text-xs text-muted-foreground">
          <th className="px-2 py-2 font-medium">Periods ({form.values.periods.length - 2})</th>
          <th className="px-2 py-2 font-medium">Options</th>
          <th className="px-2 py-2 font-medium">Amount</th>
        </tr>
      </thead>
      <tbody>
        <PaginatedRows>
          {(period: Period, index) => (
            <tr key={`${period.dates.begin}${period.dates.end}`} className="border-b last:border-b-0 hover:bg-muted/40">
              <td className="px-2 py-2.5 text-sm">{periodDatesFormat(period)}</td>
              <td className="px-2 py-2.5">
                <SelectField
                  name={`periods[${index + 1}].truncate`} // +1 due to slice
                  values={getValues(period)}
                  onChange={(event) => onPeriodTruncateChanged(index + 1, event)}
                  className="w-28"
                />
              </td>
              <td className="px-2 py-2.5 text-sm">
                <MoneyText amount={period.nominal} />
              </td>
            </tr>
          )}
        </PaginatedRows>
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={3}>
            <PaginatedOptions />
          </td>
        </tr>
      </tfoot>
    </PaginatedTable>
  );
};
