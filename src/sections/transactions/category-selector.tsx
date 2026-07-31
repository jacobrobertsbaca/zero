import { Budget } from "src/types/budget/types";
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
        <div className="flex flex-col">
          <span className="text-sm">{c.name}</span>
          <span className="text-xs text-muted-foreground">{categoryTitle(c.type)}</span>
        </div>
      ),
      textValue: c.name,
    }));

  if (!options || options.length === 0) return null;

  return <SelectField fullWidth label="Category" name="category" values={options} />;
};
