import { Stack } from "@mui/material";
import { FormikProps, useFormikContext } from "formik";
import { produce } from "immer";
import { isEqual } from "lodash";
import { ChangeEvent, useCallback, useState } from "react";
import { MoneyField } from "src/components/form/money-field";
import { SelectField } from "src/components/form/select-field";
import { Budget } from "src/types/budget/types";
import { categoryNominal, onCategoryNominal, onRecurrence } from "src/types/category/methods";
import { Category, MonthlyRecurrence, Recurrence, RecurrenceType, WeeklyRecurrence } from "src/types/category/types";

const RECURRENCE_OPTIONS = [
  { value: RecurrenceType.None, label: "None" },
  { value: RecurrenceType.Weekly, label: "Weekly" },
  { value: RecurrenceType.Monthly, label: "Monthly" },
];

const WEEKLY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const MONTHLY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1).map((d) => ({
  value: d,
  label: `Day ${d}`,
}));

const onRecurrenceChanged = (budget: Budget, category: Category, changes: Partial<Recurrence>): Category => {
  const total = !changes.amount && categoryNominal(category);
  const amount = changes.amount ?? category.recurrence.amount;
  const type = changes.type ?? category.recurrence.type;

  let recurrence: Recurrence;
  switch (type) {
    case RecurrenceType.None:
      recurrence = { type, amount };
      break;
    case RecurrenceType.Weekly:
      recurrence = {
        type,
        amount,
        day: changes.type
          ? 0
          : (changes as Partial<WeeklyRecurrence>).day ?? (category.recurrence as Partial<WeeklyRecurrence>).day ?? 0,
      };
      break;
    case RecurrenceType.Monthly:
      recurrence = {
        type,
        amount,
        day: changes.type
          ? 31
          : (changes as Partial<MonthlyRecurrence>).day ??
            (category.recurrence as Partial<MonthlyRecurrence>).day ??
            31,
      };
      break;
  }

  category = onRecurrence(budget, category, recurrence);
  if (total) category = onCategoryNominal(category, total);
  return category;
};

export const RecurrencePicker = ({ budget }: { budget: Budget }) => {
  const form = useFormikContext<Category>();

  const now = new Date();
  const [totalModified, setTotalModified] = useState<Date>(now);
  const [recurringModified, setRecurringModified] = useState<Date>(now);

  const onChange = useCallback(
    (changes: Partial<Recurrence>) => {
      form.setValues(onRecurrenceChanged(budget, form.values, changes));
    },
    [form, budget]
  );

  return (
    <>
      <MoneyField
        fullWidth
        label="Total"
        value={categoryNominal(form.values)}
        onChange={(total) => {
          setTotalModified(new Date());
          form.setValues(onCategoryNominal(form.values, total));
        }}
      />
      <SelectField
        label="Recurrence"
        name="recurrence.type"
        values={RECURRENCE_OPTIONS}
        onChange={(e) => onChange({ type: e.target.value as RecurrenceType })}
      />
      {form.values.recurrence.type !== RecurrenceType.None && (
        <Stack direction="row" spacing={2}>
          <MoneyField
            fullWidth
            sx={{ flex: 1.5 }}
            inputProps={{ sx: { height: 1 } }}
            InputProps={{ sx: { height: 1 } }}
            label="Amount"
            value={form.values.recurrence.amount}
            onChange={(a) => {
              setRecurringModified(new Date());
              onChange({ amount: a });
            }}
          />
          <SelectField
            fullWidth
            sx={{ flex: 1 }}
            label="Every"
            name="recurrence.day"
            values={form.values.recurrence.type === RecurrenceType.Weekly ? WEEKLY_OPTIONS : MONTHLY_OPTIONS}
            onChange={(e) => {
              /* Preserve most recently changed on recurring vs. total amount,
               * defaulting to total amount if neither have changed. */
              const day = parseInt(e.target.value);
              if (recurringModified > totalModified) onChange({ amount: form.values.recurrence.amount, day });
              else onChange({ day });
            }}
          />
        </Stack>
      )}
    </>
  );
};
