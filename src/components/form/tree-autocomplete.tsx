import { Autocomplete, AutocompleteProps, Checkbox, ChipTypeMap, createFilterOptions } from "@mui/material";
import React, { useMemo } from "react";

export type TreeOption<Value extends TreeOption<Value>> = {
  content?: React.ReactNode;
  label: string;
  children?: Value[];
};

export type TreeFlatOption<Value> = Value & {
  _depth: number;
  _terms: string[];
};

export type TreeAutocompleteProps<
  Value extends TreeOption<Value>,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
  ChipComponent extends React.ElementType
> = Omit<
  AutocompleteProps<TreeFlatOption<Value>, Multiple, DisableClearable, FreeSolo, ChipComponent>,
  "options" | "multiple"
> & {
  options: Value[];
};

export const TreeAutocomplete = <
  Value extends TreeOption<Value>,
  DisableClearable extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false,
  ChipComponent extends React.ElementType = ChipTypeMap["defaultComponent"]
>({
  options,
  ...rest
}: TreeAutocompleteProps<Value, true, DisableClearable, FreeSolo, ChipComponent>) => {
  const flatOptions = useMemo(() => {
    const flatten = (options: Value[], depth: number = 0): TreeFlatOption<Value>[] => {
      return options.flatMap((option) => {
        const children = flatten(option.children ?? [], depth + 1);
        return [{ ...option, _depth: depth, _terms: [option.label, ...children.map((c) => c.label)] }, ...children];
      });
    };

    return flatten(options);
  }, [options]);

  return (
    <Autocomplete
      multiple
      options={flatOptions}
      getOptionLabel={(option) => (typeof option === "string" ? option : option.label)}
      renderOption={(props, option, { selected }) => {
        const { key, ...optionProps } = props;
        return (
          <li key={key} {...optionProps}>
            <Checkbox sx={{ ml: 2 * option._depth }} checked={selected} size="small" />
            {option.label}
          </li>
        );
      }}
      filterOptions={createFilterOptions({
        /** Note: using nbsp here to avoid matching adjacent terms */
        stringify: (option) => option._terms.join(" "),
        
      })}
      {...rest}
    />
  );
};
