import {
  Alert,
  Stack,
} from "@mui/material";
import { DateField } from "src/components/form/date-field";
import { TextField } from "src/components/form/text-field";
import { Scrollbar } from "src/components/scrollbar";
import { Sidebar } from "src/components/sidebar/sidebar";
import { SidebarHeader } from "src/components/sidebar/sidebar-header";
import { Budget } from "src/types/budget/types";
import * as Yup from "yup";
import { isEqual } from "lodash";
import { useCallback, useState } from "react";
import { EditActions, EditState } from "src/components/sidebar/edit-actions";
import { DeleteDialog } from "src/components/delete-dialog";

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

  const handleDelete = async () => {};

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

          <DeleteDialog
            open={deleteModal}
            title={`Delete budget ${budget.name}?`}
            desc={"This will delete this budget and any transactions associated with it."}
            onClose={closeModal}
            onDelete={handleDelete}
          />

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
              <EditActions
                allowDelete={!!budget.id}
                dirty={!isEqual(form.values, budget)}
                state={EditState.Edit}
                onDelete={openModal}
              />
            </Stack>
          </Scrollbar>
        </>
      )}
    </Sidebar>
  );
};
