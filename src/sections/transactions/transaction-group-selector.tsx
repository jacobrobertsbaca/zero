import {
  Autocomplete,
  AutocompleteInputChangeReason,
  AutocompleteProps,
  Checkbox,
  CheckboxProps,
  Chip,
  Collapse,
  createFilterOptions,
  MenuItem,
  Stack,
  SvgIcon,
  Typography,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { Budget } from "src/types/budget/types";
import { Category } from "src/types/category/types";

import ChevronRight from "@heroicons/react/20/solid/ChevronRightIcon";
import ChevronDown from "@heroicons/react/20/solid/ChevronDownIcon";

type CategoryOption = {
  budget: Budget;
  category: Category;
};

type TransactionGroupSelectorBaseProps = {
  options: readonly Budget[];
  categories: string[];
  budgets: string[];
  onChange: (categories: string[], budgets: string[]) => void;
};

export type TransactionGroupSelectorProps = Omit<
  AutocompleteProps<CategoryOption, true, false, false>,
  "options" | "value" | "onChange"
> &
  TransactionGroupSelectorBaseProps;

const filterOptions = createFilterOptions<CategoryOption>({
  stringify: (option) => `${option.category.name} ${option.budget.name} ${option.category.type}`,
});

export const TransactionGroupSelector = ({
  options,
  categories,
  budgets,
  onChange,
  ...rest
}: TransactionGroupSelectorProps) => {
  const [open, setOpen] = useState(new Set<string>());
  const [input, setInput] = useState("");

  const flatOptions = useMemo(() => {
    return options.flatMap((budget) => budget.categories.map((category) => ({ budget, category })));
  }, [options]);

  const getFilteredOptions = useCallback(
    (value: string) =>
      filterOptions(flatOptions, { inputValue: value, getOptionLabel: (option) => option.category.name }),
    [flatOptions]
  );

  const value: CategoryOption[] = useMemo(() => {
    const value: CategoryOption[] = [];
    const categorySet = new Set(categories);

    for (const budget of budgets) {
      const budgetOptions = flatOptions.filter((option) => option.budget.id === budget);

      for (const option of budgetOptions) {
        categorySet.delete(option.category.id);
        value.push(option);
      }
    }

    for (const category of categorySet) {
      const option = flatOptions.find((option) => option.category.id === category);
      if (option) value.push(option);
    }

    return value;
  }, [categories, budgets, flatOptions]);

  const onAutocompleteChange = useCallback(
    (event: React.SyntheticEvent, value: CategoryOption[], reason: string) => {
      const categorySet = new Set(value.map((option) => option.category.id));
      const budgetIds: string[] = [];
      for (const budget of options) {
        const budgetCategories = budget.categories.map((category) => category.id);
        if (budgetCategories.every((category) => categorySet.has(category))) {
          budgetIds.push(budget.id);
          for (const category of budgetCategories) categorySet.delete(category);
        }
      }

      onChange(Array.from(categorySet), budgetIds);
    },
    [options, onChange]
  );

  const selectBudget = useCallback(
    (budget: Budget, selected: boolean) => {
      const budgetSet = new Set(budgets);
      const budgetCategories = new Set(budget.categories.map((category) => category.id));
      const categorySet = new Set(categories);

      if (!selected) {
        budgetSet.delete(budget.id);
        budgetCategories.forEach((category) => categorySet.delete(category));
      } else {
        const universe = getFilteredOptions(input);
        const choices = universe.filter((option) => option.budget.id === budget.id);

        if (choices.length === budget.categories.length) {
          budgetSet.add(budget.id);
          budgetCategories.forEach((category) => categorySet.delete(category));
        } else {
          budgetSet.delete(budget.id);
          choices.forEach((option) => categorySet.add(option.category.id));
        }
      }

      onChange(Array.from(categorySet), Array.from(budgetSet));
    },
    [budgets, categories, input, getFilteredOptions, onChange]
  );

  const onInputChange = useCallback(
    (event: React.SyntheticEvent, value: string, reason: AutocompleteInputChangeReason) => {
      // By default, MUI clears the input when the user selects an option
      // With multiple selections, this is kind of jittery so we prevent this here.
      if (reason === "reset") return;

      // Expand all groups that match the input
      if (value === "") setOpen(new Set());
      else setOpen(new Set(getFilteredOptions(value).map((option) => option.budget.id)));

      setInput(value);
    },
    [flatOptions, getFilteredOptions]
  );

  return (
    <Autocomplete
      multiple
      options={flatOptions}
      value={value}
      onChange={onAutocompleteChange}
      getOptionLabel={(option) => option.category.name}
      getOptionKey={(option) => option.category.id}
      groupBy={(option) => option.budget.id}
      renderGroup={(params) => (
        <CollapseGroup
          key={params.key}
          budget={options.find((b) => b.id === params.group)!}
          open={open.has(params.group)}
          setOpen={(open) =>
            setOpen((prev) => {
              const next = new Set(prev);
              if (open) next.add(params.group);
              else next.delete(params.group);
              return next;
            })
          }
          options={options}
          categories={categories}
          budgets={budgets}
          onChange={onChange}
          selectBudget={selectBudget}
        >
          {params.children}
        </CollapseGroup>
      )}
      renderOption={(props, option, { selected }) => {
        const { key, ...optionProps } = props;
        return (
          <MenuItem key={key} sx={{ ml: 4 }} dense {...optionProps}>
            <Check checked={selected} />
            {option.category.name}
          </MenuItem>
        );
      }}
      renderTags={(value, getTagProps) => {
        const budgetSet = new Set(budgets);
        const renderedBudgets = new Set<string>();

        return value.map((option, index) => {
          const tagProps = getTagProps({ index });
          if (budgetSet.has(option.budget.id)) {
            if (renderedBudgets.has(option.budget.id)) return null;
            renderedBudgets.add(option.budget.id);
            tagProps.onDelete = () => selectBudget(option.budget, false);
            return <Chip {...tagProps} key={option.budget.id} size="small" label={option.budget.name} />;
          } else return <Chip {...tagProps} key={option.category.id} size="small" label={option.category.name} />;
        });
      }}
      filterOptions={filterOptions}
      inputValue={input}
      onInputChange={onInputChange}
      disableCloseOnSelect
      {...rest}
    />
  );
};

type CollapseGroupProps = TransactionGroupSelectorBaseProps & {
  budget: Budget;
  selectBudget: (budget: Budget, selected: boolean) => void;
  children?: React.ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CollapseGroup = ({ budget, selectBudget, children, open, setOpen, categories, budgets }: CollapseGroupProps) => {
  const selected: boolean | null = useMemo(() => {
    if (budgets.includes(budget.id)) return true;
    const chosen = budget.categories.filter((category) => categories.includes(category.id));
    if (chosen.length > 0) return null;
    return false;
  }, [budget, budgets, categories]);

  return (
    <>
      <MenuItem dense onClick={() => setOpen(!open)} sx={{ pl: 1.5 }} selected={!!selected}>
        <Stack direction="row" alignItems="center">
          <SvgIcon sx={{ py: 0.5 }}>{open ? <ChevronDown /> : <ChevronRight />}</SvgIcon>
          <Check
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              const checked = budgets.includes(budget.id);
              selectBudget(budget, !checked);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            checked={!!selected}
            indeterminate={selected === null}
          />
          <Typography variant="inherit" display={"inline"}>
            {budget.name}
          </Typography>
        </Stack>
      </MenuItem>
      <Collapse in={open}>{children}</Collapse>
    </>
  );
};

const Check = (props: CheckboxProps) => {
  return <Checkbox size="small" {...props} />;
};
