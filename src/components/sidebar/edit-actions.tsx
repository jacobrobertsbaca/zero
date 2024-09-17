import { Box, BoxProps, Button, Stack, SvgIcon } from "@mui/material";

import TrashIcon from "@heroicons/react/24/outline/TrashIcon";
import { SubmitButton } from "../form/submit-button";
import { useCallback, useState } from "react";
import { useSnackbar } from "notistack";
import { LoadingButton, LoadingButtonProps } from "@mui/lab";

export enum EditState {
  View,
  Edit,
}

type EditActionsProps = BoxProps & {
  dirty?: boolean;
  state: EditState;
  onStateChanged?: (state: EditState) => void;
  onDelete?: () => void | Promise<void>;
  ButtonProps?: {
    submit?: LoadingButtonProps;
    delete?: LoadingButtonProps;
  };
};

export const EditActions = (props: EditActionsProps) => {
  const { dirty, state, onStateChanged, onDelete, ButtonProps, ...boxProps } = props;
  const { submit: submitProps, delete: deleteProps } = ButtonProps ?? {};

  const { enqueueSnackbar } = useSnackbar();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (err: any) {
      enqueueSnackbar(err.message, { variant: "error" });
    }
    setDeleting(false);
  }, [onDelete, enqueueSnackbar]);

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
            {
              // Pass children as prop so they are overridable by ButtonProps
              /* eslint-disable-next-line react/no-children-prop */
              <SubmitButton variant="outlined" disabled={!dirty} children="Save" {...submitProps} />
            }
            {onDelete && (
              <LoadingButton
                variant="outlined"
                color="error"
                loading={deleting}
                startIcon={
                  <SvgIcon>
                    <TrashIcon />
                  </SvgIcon>
                }
                onClick={handleDelete}
                // Pass children as prop so they are overridable by ButtonProps
                /* eslint-disable-next-line react/no-children-prop */
                children={<span>Delete</span>}
                {...deleteProps}
              />
            )}
          </>
        )}
      </Stack>
    </Box>
  );
};
