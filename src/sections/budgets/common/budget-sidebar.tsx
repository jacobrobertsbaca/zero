import { Alert, Stack } from "@mui/material";
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
import { useApi } from "src/hooks/use-api";
import { datesDays } from "src/types/utils/methods";
import { budgetMaxDays, budgetMaxYears } from "../../../types/budget/methods";

type BudgetSidebarProps = {
  budget: Budget;
  open: boolean;
  onClose: () => void;
  onUpdate: (budget: Budget) => void;
  onDelete?: () => void;
};

export const BudgetSidebar = ({ budget, open, onClose, onUpdate, onDelete }: BudgetSidebarProps) => {
  const { putBudget, deleteBudget } = useApi();
  const [deleteModal, setDeleteModal] = useState(false);
  const openModal = useCallback(() => setDeleteModal(true), []);
  const closeModal = useCallback(() => setDeleteModal(false), []);
  const isExisting = !!budget.id;

  const handleDelete = async () => {
    await deleteBudget(budget);
    onDelete?.();
  };

  return (
    <Sidebar
      open={open}
      onClose={onClose}
      FormProps={{
        enableReinitialize: true,
        initialValues: budget,
        validationSchema: Yup.object({
          name: Yup.string().trim().required("You must provide a name!"),
          dates: Yup.object({
            begin: Yup.string().required("Enter a valid date!"),
            end: Yup.string()
              .required("Enter a valid date!")
              .test("before-begin", "Can't be before begin date!", (value, ctx) => value >= ctx.parent.begin)
              .test("max-duration", `Budgets can't be more than ${budgetMaxYears()} years long!`, (value, ctx) => datesDays(ctx.parent) <= budgetMaxDays()),
          }),
        }),
        async onSubmit(budget) {
          budget = await putBudget(budget);
          setDeleteModal(false);
          onUpdate(budget);
          onClose();
        },
      }}
    >
      {(form) => (
        <>
          <SidebarHeader onClose={onClose}>{isExisting ? "Edit Budget Details" : "New Budget" }</SidebarHeader>

          <DeleteDialog
            open={deleteModal}
            title={`Delete budget ${budget.name}?`}
            desc={"This will delete this budget and any transactions associated with it."}
            onClose={closeModal}
            onDelete={handleDelete}
          />

          <Scrollbar sx={{ flexGrow: 1 }}>
            <Stack spacing={3} sx={{ p: 3 }}>
              <TextField fullWidth label="Name" name="name" type="text" max={60} />
              <DateField label="Begin" name="dates.begin" />
              <DateField label="End" name="dates.end" />
              {isExisting && !isEqual(form.values.dates, budget.dates) && (
                <Alert severity="warning">
                  Changing budget dates will preserve the total planned amount of existing categories, but their
                  recurring amounts may change as a result.
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
