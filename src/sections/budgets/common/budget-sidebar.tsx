import { AlertTriangle } from "lucide-react";
import { DateRangeField } from "src/components/form/date-range-field";
import { TextField } from "src/components/form/text-field";
import { Sidebar } from "src/components/sidebar/sidebar";
import { Budget } from "src/types/budget/types";
import * as Yup from "yup";
import { isEqual } from "lodash";
import { useCallback, useState } from "react";
import { EditActions, EditState } from "src/components/sidebar/edit-actions";
import { DeleteDialog } from "src/components/delete-dialog";
import { useBudgetChanges } from "src/hooks/use-api";
import { datesDays } from "src/types/utils/methods";
import { budgetMaxDays, budgetMaxYears } from "../../../types/budget/methods";

type BudgetSidebarProps = {
  budget: Budget;
  open: boolean;
  onClose: () => void;
  onUpdate?: (budget: Budget) => boolean | void;
  onDelete?: () => void;
};

export const BudgetSidebar = ({ budget, open, onClose, onUpdate, onDelete }: BudgetSidebarProps) => {
  const { putBudget, deleteBudget } = useBudgetChanges();
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
      title={isExisting ? "Edit Budget Details" : "New Budget"}
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
              .test(
                "max-duration",
                `Budgets can't be more than ${budgetMaxYears()} years long!`,
                (value, ctx) => datesDays(ctx.parent) <= budgetMaxDays()
              ),
          }),
        }),
        async onSubmit(budget) {
          budget = await putBudget(budget);
          setDeleteModal(false);
          const updateResult = onUpdate?.(budget);
          if (typeof updateResult !== "boolean" || updateResult) onClose();
        },
      }}
    >
      {(form) => (
        <>
          <DeleteDialog
            open={deleteModal}
            title={`Delete budget ${budget.name}?`}
            desc={"This will delete this budget and any transactions associated with it."}
            onClose={closeModal}
            onDelete={handleDelete}
          />

          <TextField
            fullWidth
            label="Name"
            name="name"
            type="text"
            placeholder="Spring Budget, Summer Trip, Wedding…"
            max={60}
          />
          <DateRangeField label="Dates" name="dates" />
          {isExisting && !isEqual(form.values.dates, budget.dates) && (
            <div className="flex gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              <span>
                Changing budget dates will preserve the total planned amount of existing categories, but their recurring
                amounts may change as a result.
              </span>
            </div>
          )}
          <EditActions
            dirty={!isEqual(form.values, budget)}
            state={EditState.Edit}
            onDelete={budget.id ? openModal : undefined}
          />
        </>
      )}
    </Sidebar>
  );
};
