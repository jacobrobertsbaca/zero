import { Autocomplete, AutocompleteProps, Box, Checkbox, Collapse, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { Budget } from "src/types/budget/types";
import { Category } from "src/types/category/types";

type CategoryOption = {
  budget: Budget;
  category: Category;
};

export type TransactionGroupSelectorProps = Omit<AutocompleteProps<CategoryOption, true, false, false>, "options"> & {
  options: readonly Budget[];
};

export const TransactionGroupSelector = ({ options, ...rest }: TransactionGroupSelectorProps) => {
  const flatOptions = useMemo(() => {
    return options.flatMap((budget) => budget.categories.map((category) => ({ budget, category })));
  }, [options]);

  const [open, setOpen] = useState(new Set<string>());
  const [input, setInput] = useState("");

  return (
    <Autocomplete
      multiple
      options={flatOptions}
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
              console.log(next);
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
          <li key={key} {...optionProps}>
            <Checkbox checked={selected} size="small" />
            {option.category.name}
          </li>
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
  key: string;
  budget: Budget;
  children?: React.ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CollapseGroup = ({ key, budget, children, open, setOpen }: CollapseGroupProps) => {
  console.log(budget.name, open);
  return (
    <Box key={key}>
      <Checkbox size="small" />
      <Typography variant="inherit" display={"inline"} onClick={() => setOpen(!open)}>
        {budget.name}
      </Typography>
      <Collapse in={open}>{children}</Collapse>
    </Box>
  );
};
