import { Box, Button, ButtonGroup, Stack, SvgIcon, Typography } from "@mui/material";
import { Category } from "src/types/category/types";

import TrashIcon from "@heroicons/react/24/outline/TrashIcon";

export enum CategoryEditState {
  View,
  Edit,
  ConfirmDelete,
  Wait,
}

type CategoryEditActionsProps = {
  category: Category;
  state: CategoryEditState;
  onStateChanged: (state: CategoryEditState) => void;
  dirty: boolean;
};

export const CategoryEditActions = (props: CategoryEditActionsProps) => {
  const { category, state, onStateChanged, dirty } = props;
  return (
    <Box sx={{ px: 3, py: 2 }}>
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
              >
                Delete
              </Button>
              <Button onClick={() => onStateChanged(CategoryEditState.View)}>Cancel</Button>
            </>
          )}
          {state === CategoryEditState.View && (
            <>
              <Button onClick={() => onStateChanged(CategoryEditState.Edit)}>Edit</Button>
              <Button onClick={() => onStateChanged(CategoryEditState.ConfirmDelete)}>
                Delete
              </Button>
            </>
          )}
          {state === CategoryEditState.Edit && (
            <>
              <Button disabled={!dirty}>Save</Button>
              <Button onClick={() => onStateChanged(CategoryEditState.View)}>Cancel</Button>
            </>
          )}
        </ButtonGroup>

        {(state === CategoryEditState.ConfirmDelete) && (
          <Typography variant="subtitle2">
            Really delete&nbsp;
            <Typography variant="inherit" display="inline" fontWeight={600}>
              {category.name}
            </Typography>
            ?
          </Typography>
        )}
      </Stack>
    </Box>
  );
};
