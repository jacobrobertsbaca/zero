import { Budget } from "src/types/budget/types";
import { useCallback } from "react";
import { Collapse, Stack, Typography } from "@mui/material";
import { categoryTitle } from "src/types/category/methods";
import { useFormikContext } from "formik";
import { Transaction } from "src/types/transaction/types";
import { SelectField } from "src/components/form/select-field";

type CategorySelectorProps = {
  budgets: readonly Budget[];
};

export const CategorySelector = ({ budgets }: CategorySelectorProps) => {
  const { values } = useFormikContext<Transaction>();
  const budget = budgets.find((b) => b.id === values.budget);
  const options =
    budget &&
    budget.categories.map((c) => ({
      value: c.id,
      label: (
        <Stack>
          <Typography variant="body2">{c.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {categoryTitle(c.type)}
          </Typography>
        </Stack>
      ),
    }));

  const show = !!options && options.length > 0;

  console.log(options);
  return (
    <Collapse in={show} sx={{ mt: show ? undefined : "0 !important" }}>
      <SelectField fullWidth label="Category" name="category" values={options ?? []} />
    </Collapse>
  );
};
