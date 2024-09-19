import { Autocomplete, Box, ClickAwayListener, Paper, Popper, TextField, TextFieldProps } from "@mui/material";
import { RichTreeView, RichTreeViewProps } from "@mui/x-tree-view";
import { Dispatch, SetStateAction, useCallback, useRef, useState } from "react";

export type TreeAutocompleteOption = {
  id: string;
  label: string;
  children?: TreeAutocompleteOption[];
};

export type TreeSearchProps<R extends TreeAutocompleteOption, Multiple extends boolean | undefined> = RichTreeViewProps<
  R,
  Multiple
>;

const TreeSearch = <R extends TreeAutocompleteOption, Multiple extends boolean | undefined>({
  ...rest
}: TreeSearchProps<R, Multiple>) => {
  return <RichTreeView {...rest} />;
};

const useSensitiveOpen = (delayMs: number) => {
  const lastOpen = useRef(0);
  const [open, setOpen] = useState(false);

  return {
    open,
    setOpen(value: boolean) {
      if (value) lastOpen.current = Date.now();
      setOpen(value);
    },
    closeSensitive() {
      if (Date.now() - lastOpen.current > delayMs) setOpen(false);
    },
  };
};

export type TreeAutocompleteProps<R extends TreeAutocompleteOption, Multiple extends boolean | undefined> = {
  items: R[];
  slotProps?: {
    tree?: Omit<TreeSearchProps<R, Multiple>, "items">;
    input?: TextFieldProps;
  };
};

export const TreeAutocomplete = <R extends TreeAutocompleteOption, Multiple extends boolean | undefined>({
  items,
  slotProps,
}: TreeAutocompleteProps<R, Multiple>) => {
  slotProps = slotProps ?? {};
  const { tree: treeProps, input: inputProps } = slotProps;
  const { open, setOpen, closeSensitive } = useSensitiveOpen(150);

  return (
    <Autocomplete
      options={items.length ? [items] : []} // So that we show no options if there are no tree items
      renderOption={() => <TreeSearch items={items} {...treeProps} />}
      renderInput={(params) => (
        <TextField {...params} {...inputProps} onFocus={(e) => setOpen(true)} onBlur={(e) => e.preventDefault()} />
      )}
      getOptionLabel={() => ""}
      getOptionKey={() => ""}
      filterOptions={(o) => o}
      disableCloseOnSelect
      onOpen={() => setOpen(true)}
      onClose={(_, reason) => {
        if (reason !== "blur" && reason != "toggleInput") setOpen(false);
      }}
      open={open}
      PopperComponent={(props) => (
        <ClickAwayListener onClickAway={closeSensitive}>
          <Popper {...props} />
        </ClickAwayListener>
      )}
    />
  );
};
