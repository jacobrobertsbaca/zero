import {
  Alert,
  AlertTitle,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  SvgIcon,
  Typography,
} from "@mui/material";
import { DateField } from "src/components/form/date-field";
import { SubmitButton } from "src/components/form/submit-button";
import { TextField } from "src/components/form/text-field";
import { Scrollbar } from "src/components/scrollbar";
import { Sidebar } from "src/components/sidebar/sidebar";
import { SidebarHeader } from "src/components/sidebar/sidebar-header";
import { Budget } from "src/types/budget/types";
import TrashIcon from "@heroicons/react/24/outline/TrashIcon";
import * as Yup from "yup";
import { isEqual } from "lodash";
import { useCallback, useState } from "react";

type BudgetSidebarProps = {
  budget: Budget;
  open: boolean;
  onClose: () => void;
};

export const BudgetSidebar = ({ budget, open, onClose }: BudgetSidebarProps) => {
  const [deleteModal, setDeleteModal] = useState(false);
  const openModal = useCallback(() => setDeleteModal(true), []);
  const closeModal = useCallback(() => setDeleteModal(false), []);

  const isExisting = !!budget.id;

  return (
    <Sidebar
      open={open}
      onClose={onClose}
      FormProps={{
        enableReinitialize: true,
        initialValues: budget,
        validationSchema: Yup.object({
          name: Yup.string().required("You must provide a name!"),
          dates: Yup.object({
            begin: Yup.string().required("Enter a valid date!"),
            end: Yup.string()
              .required("Enter a valid date!")
              .test("before-begin", "Can't be before begin date!", (value, ctx) => value >= ctx.parent.begin),
          }),
        }),
        async onSubmit(values) {},
      }}
    >
      {(form) => (
        <>
          <SidebarHeader onClose={onClose}>Edit Budget Details</SidebarHeader>

          <Dialog
            open={deleteModal}
            onClose={closeModal}
            aria-aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <DialogTitle id="delete-dialog-title">Delete budget {budget.name}?</DialogTitle>
            <DialogContent>
              <DialogContentText id="delete-dialog-description">
                This will delete this budget and any transactions associated with it.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeModal} autoFocus>
                Cancel
              </Button>
              <Button onClick={closeModal} color="error">
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          <Scrollbar sx={{ flexGrow: 1 }}>
            <Stack spacing={3} sx={{ p: 3 }}>
              <TextField fullWidth label="Name" name="name" type="text" />
              <DateField label="Begin" name="dates.begin" />
              <DateField label="End" name="dates.end" />
              {isExisting && !isEqual(form.values.dates, budget.dates) && (
                <Alert severity="warning">
                  Changing budget dates will preserve the total value of any existing categories.
                </Alert>
              )}
            </Stack>
          </Scrollbar>

          <Stack spacing={1} sx={{ px: 3, py: 2 }}>
            <SubmitButton variant="outlined" disabled={isEqual(form.values, budget)}>
              Save
            </SubmitButton>
            {isExisting && (
              <Button
                variant="outlined"
                color="error"
                startIcon={
                  <SvgIcon>
                    <TrashIcon />
                  </SvgIcon>
                }
                onClick={openModal}
              >
                Delete
              </Button>
            )}
          </Stack>
        </>
      )}
    </Sidebar>
  );
};
