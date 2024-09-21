import { Autocomplete, AutocompleteProps, ChipTypeMap } from "@mui/material";
import React, { useMemo } from "react";

export type TreeAutocompleteOption = {
  id: string;
  label: React.ReactNode;
  children?: TreeAutocompleteOption[];
};

export type TreeAutocompleteFlatOption = TreeAutocompleteOption & {
  depth: number;
};

export type TreeAutocompleteProps<
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
  ChipComponent extends React.ElementType
> = Omit<
  AutocompleteProps<TreeAutocompleteFlatOption, Multiple, DisableClearable, FreeSolo, ChipComponent>,
  "options"
> & {
  options: TreeAutocompleteOption[];
};

export const TreeAutocomplete = <
  Multiple extends boolean | undefined = false,
  DisableClearable extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false,
  ChipComponent extends React.ElementType = ChipTypeMap["defaultComponent"]
>({
  options,
  ...rest
}: TreeAutocompleteProps<Multiple, DisableClearable, FreeSolo, ChipComponent>) => {
  const flatOptions = useMemo(() => {
    const flatten = (options: TreeAutocompleteOption[], depth = 0): TreeAutocompleteFlatOption[] => {
      return options.flatMap((option) => {
        return [{ ...option, depth }, ...flatten(option.children ?? [], depth + 1)];
      });
    };

    return flatten(options);
  }, [options]);

  return <Autocomplete options={flatOptions} {...rest} />;
};
