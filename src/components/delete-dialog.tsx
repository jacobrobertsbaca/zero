import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import React, { useCallback, useState } from "react";
import { LoadingButton } from "@mui/lab";
import { wrapAsync } from "src/utils/wrap-errors";

type DeleteDialogProps = {
  open: boolean;
  title: React.ReactNode;
  desc?: React.ReactNode;
  onClose: () => void;
  onDelete: () => Promise<void> | void;
};

export const DeleteDialog = ({ open, title, desc, onClose, onDelete }: DeleteDialogProps) => {
  const [loading, setLoading] = useState(false);
  const handleDelete = useCallback(async () => {
    setLoading(true);
    await wrapAsync(async () => {
      await onDelete();
      onClose();
    });
    setLoading(false);
  }, [onDelete, onClose]);

  const handleClose = useCallback(() => {
    if (loading) return;
    onClose();
  }, [loading, onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="delete-dialog-title"
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
