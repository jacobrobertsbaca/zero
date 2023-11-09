import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { useSnackbar } from "notistack";
import React, { useCallback, useState } from "react";
import { SubmitButton } from "./form/submit-button";
import { LoadingButton } from "@mui/lab";

type DeleteDialogProps = {
  open: boolean;
  title: React.ReactNode;
  desc?: React.ReactNode;
  onClose: () => void;
  onDelete: () => Promise<void> | void;
};

export const DeleteDialog = ({ open, title, desc, onClose, onDelete }: DeleteDialogProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const handleDelete = useCallback(async () => {
    setLoading(true);
    try {
      await onDelete();
      onClose();
    } catch (err: any) {
      enqueueSnackbar(err.message, { variant: "error" });
    }
    setLoading(false);
  }, [onDelete, onClose, enqueueSnackbar]);

  const handleClose = useCallback(() => {
    if (loading) return;
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      <DialogTitle id="delete-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-dialog-description">{desc}</DialogContentText>
      </DialogContent>
      <DialogActions>
        {!loading && (
          <Button onClick={handleClose} autoFocus>
            Cancel
          </Button>
        )}
        <LoadingButton onClick={handleDelete} loading={loading} color="error">
          <span>Delete</span>
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
