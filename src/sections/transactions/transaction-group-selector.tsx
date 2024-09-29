import {
  Autocomplete,
  AutocompleteProps,
  Checkbox,
  CheckboxProps,
  Collapse,
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

export type TransactionGroupSelectorProps = Omit<
  AutocompleteProps<CategoryOption, true, false, false>,
  "options" | "value" | "onChange"
> & {
  options: readonly Budget[];
  categories: string[];
  budgets: string[];
  onChange: (categories: string[], budgets: string[]) => void;
};

export const TransactionGroupSelector = ({
  options,
  categories,
  budgets,
  onChange,
  ...rest
}: TransactionGroupSelectorProps) => {
  const flatOptions = useMemo(() => {
    return options.flatMap((budget) => budget.categories.map((category) => ({ budget, category })));
  }, [options]);

  const [open, setOpen] = useState(new Set<string>());
  const [input, setInput] = useState("");

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
  }, [categories, budgets]);

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
    [options]
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
      inputValue={input}
      onInputChange={(event, value, reason) => {
        if (reason === "reset") return;
        setInput(value);
      }}
      disableCloseOnSelect
      {...rest}
    />
  );
};

type CollapseGroupProps = {
  budget: Budget;
  children?: React.ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CollapseGroup = ({ budget, children, open, setOpen }: CollapseGroupProps) => {
  return (
    <>
      <MenuItem dense onClick={() => setOpen(!open)}>
        <Stack direction="row" alignItems="center">
          <SvgIcon sx={{ py: 0.5 }}>{open ? <ChevronDown /> : <ChevronRight />}</SvgIcon>
          <Check
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
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
