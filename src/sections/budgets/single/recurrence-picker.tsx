import { Stack } from "@mui/material";
import { FormikProps } from "formik";
import { produce } from "immer";
import { ChangeEvent, useCallback } from "react";
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

export const RecurrencePicker = ({ budget, form }: { budget: Budget; form: FormikProps<Category> }) => {
  const onChange = useCallback(
    (changes: Partial<Recurrence>) => {
      form.setValues(onRecurrenceChanged(budget, form.values, changes));
    },
    [form, budget]
  );

  return (
    <>
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
            sx={{ flex: 2 }}
            inputProps={{ sx: { height: 1 }}}
            label="Amount"
            value={form.values.recurrence.amount}
            onChange={(a) => onChange({ amount: a })}
          />
          <SelectField
            fullWidth
            sx={{ flex: 1 }}
            label="Every"
            name="recurrence.day"
            values={form.values.recurrence.type === RecurrenceType.Weekly ? WEEKLY_OPTIONS : MONTHLY_OPTIONS}

            // Passing `amount` for changes here so that when changing day, recurring amount remains the same. 
            onChange={(e) => onChange({ amount: form.values.recurrence.amount, day: parseInt(e.target.value) })}
          />
        </Stack>
      )}
    </>
  );
};
