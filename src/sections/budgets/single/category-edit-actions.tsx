import { Box, Button, ButtonGroup, CircularProgress, Divider, Stack, SvgIcon, Typography } from "@mui/material";
import { Category } from "src/types/category/types";

import TrashIcon from "@heroicons/react/24/outline/TrashIcon";
import { useFormikContext } from "formik";
import { categoryDirty } from "src/types/category/methods";
import { useCallback, useState } from "react";
import { useSnackbar } from "notistack";

export enum CategoryEditState {
  View,
  Edit,
  ConfirmDelete,
}

type CategoryEditActionsProps = {
  category: Category;
  state: CategoryEditState;
  onStateChanged: (state: CategoryEditState) => void;
  onDelete: () => Promise<void> | void;
};

export const CategoryEditActions = (props: CategoryEditActionsProps) => {
  const { category, state, onStateChanged, onDelete } = props;
  const { enqueueSnackbar } = useSnackbar();
  const form = useFormikContext<Category>();
  const dirty = categoryDirty(category, form.values);

  const handleDelete = useCallback(async () => {
    form.setSubmitting(true);
    try {
      await onDelete();
    } catch (err: any) {
      enqueueSnackbar(err.message, { variant: "error" });
    }
    form.setSubmitting(false);
  }, [form, onDelete, enqueueSnackbar]);

  return (
    <Box>
      <Divider />
      <Box sx={{ px: 3, py: 2 }}>
        {form.isSubmitting && (
          <Stack direction="row" alignItems="center" justifyContent="center">
            <CircularProgress size={24} />
          </Stack>
        )}
        {!form.isSubmitting && (
          <Stack direction="row-reverse" alignItems="center" justifyContent="space-between">
            <ButtonGroup variant="text">
              {state === CategoryEditState.ConfirmDelete && (
                <>
                  <Button
                    color="error"
                    startIcon={
                      <SvgIcon>
                        <TrashIcon />
                      </SvgIcon>
                    }
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                  <Button onClick={() => onStateChanged(CategoryEditState.View)}>Cancel</Button>
                </>
              )}
              {state === CategoryEditState.View && (
                <>
                  <Button onClick={() => onStateChanged(CategoryEditState.Edit)}>Edit</Button>
                  <Button onClick={() => onStateChanged(CategoryEditState.ConfirmDelete)}>Delete</Button>
                </>
              )}
              {state === CategoryEditState.Edit && (
                <>
                  <Button disabled={!dirty} type="submit">
                    Save
                  </Button>
                  {category.id && <Button onClick={() => onStateChanged(CategoryEditState.View)}>Cancel</Button>}
                </>
              )}
            </ButtonGroup>

            {state === CategoryEditState.ConfirmDelete && (
              <Typography variant="subtitle2">
                Really delete&nbsp;
                <Typography variant="inherit" display="inline" fontWeight={600}>
                  {category.name}
                </Typography>
                ?
              </Typography>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
};
