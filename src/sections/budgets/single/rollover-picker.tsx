import { Stack } from "@mui/material";
import { FormikProps, useFormikContext } from "formik";
import { SelectField } from "src/components/form/select-field";
import { Category, RolloverMode } from "src/types/category/types";

const ROLLOVER_OPTIONS = [
  { value: RolloverMode.None, label: "None" },
  { value: RolloverMode.Average, label: "Average" },
  { value: RolloverMode.Next, label: "Next" }
];

const helperText = (surplus: boolean, mode: RolloverMode): string | undefined => {
  const noun = `${surplus ? "Money left over" : "Overspending"} from prior periods`;
  switch (mode) {
    case RolloverMode.None:
      return;
    case RolloverMode.Average:
      return `${noun} will be averaged across later periods`;
    case RolloverMode.Next:
      return `${noun} will be rolled over to the current period`;
  }
};

export const RolloverPicker = () => {
  const form = useFormikContext<Category>();
  return (
    <>
      <SelectField
        fullWidth
        label="Surplus"
        name="rollover.surplus"
        values={ROLLOVER_OPTIONS}
        helperText={helperText(true, form.values.rollover.surplus)}
      />
      <SelectField
        fullWidth
        label="Losses"
        name="rollover.loss"
        values={ROLLOVER_OPTIONS}
        helperText={helperText(false, form.values.rollover.loss)}
      />
    </>
  )
};
