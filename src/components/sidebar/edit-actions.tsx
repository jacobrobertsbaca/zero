import {
  Box,
  BoxProps,
  Button,
  Stack,
  SvgIcon,
} from "@mui/material";

import TrashIcon from "@heroicons/react/24/outline/TrashIcon";
import { SubmitButton } from "../form/submit-button";

export enum EditState {
  View,
  Edit,
}

type EditActionsProps = BoxProps & {
  allowDelete?: boolean;
  dirty?: boolean;
  state: EditState;
  onStateChanged?: (state: EditState) => void;
  onDelete?: () => void;
};

export const EditActions = (props: EditActionsProps) => {
  const { allowDelete, dirty, state, onStateChanged, onDelete, ...boxProps } = props;

  return (
    <Box {...boxProps}>
      <Stack spacing={1}>
        {state === EditState.View && (
          <Button variant="outlined" onClick={() => onStateChanged?.(EditState.Edit)}>
            Edit
          </Button>
        )}
        {state === EditState.Edit && (
          <>
            <SubmitButton variant="outlined" disabled={!dirty}>
              Save
            </SubmitButton>
            {allowDelete && (
              <Button
                variant="outlined"
                color="error"
                startIcon={
                  <SvgIcon>
                    <TrashIcon />
                  </SvgIcon>
                }
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
};
