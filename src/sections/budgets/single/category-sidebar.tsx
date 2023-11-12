import {
  Stack,
  Typography,
} from "@mui/material";

import { Scrollbar } from "src/components/scrollbar";
import { Category, CategoryType, RecurrenceType } from "src/types/category/types";
import {
  categoryActual,
  categoryDirty,
  categoryNominal,
  categoryTitle,
  onCategoryNominal,
} from "src/types/category/methods";
import { PeriodList } from "./period-list";
import { MoneyText } from "src/components/money-text";
import { EditActions, EditState } from "../../../components/sidebar/edit-actions";
import { useCallback, useEffect, useState } from "react";

import { TextField } from "src/components/form/text-field";
import { useFormikContext } from "formik";
import { SelectField } from "src/components/form/select-field";
import { MoneyField } from "src/components/form/money-field";
import { PeriodListMutable } from "./period-list-mutable";
import { RecurrencePicker } from "./recurrence-picker";
import { Budget } from "src/types/budget/types";
import { RolloverPicker } from "./rollover-picker";
import * as Yup from "yup";
import { useApi } from "src/hooks/use-api";
import { Sidebar } from "src/components/sidebar/sidebar";
import { SidebarHeader } from "src/components/sidebar/sidebar-header";
import { DeleteDialog } from "src/components/delete-dialog";

/* ================================================================================================================= *
 * Utility                                                                                                           *
 * ================================================================================================================= */

const recurrenceSummary = (category: Category): string => {
  switch (category.recurrence.type) {
    case RecurrenceType.None:
      return `overall`;
    case RecurrenceType.Monthly:
      return `monthly on day ${category.recurrence.day}`;
    case RecurrenceType.Weekly:
      return `weekly on ${
        {
          0: "Sunday",
          1: "Monday",
          2: "Tuesday",
          3: "Wednesday",
          4: "Thursday",
          5: "Friday",
          6: "Saturday",
        }[category.recurrence.day]
      }`;
  }
};

const SidebarItem = ({ title, children }: { title: React.ReactNode; children: React.ReactNode }) => (
  <Stack>
    <Typography variant="subtitle1">{title}</Typography>
    <Typography variant="subtitle2" color="text.secondary">
      {children}
    </Typography>
  </Stack>
);

/* ================================================================================================================= *
 * Edit vs. View                                                                                                     *
 * ================================================================================================================= */

const TYPE_OPTIONS = Object.values(CategoryType).map((t) => ({
  value: t,
  label: categoryTitle(t),
}));

const CategoryEditView = ({ budget }: { budget: Budget }) => {
  const form = useFormikContext<Category>();

  /* Reset the form on unmount */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => form.resetForm(), []);

  return (
    <>
      <TextField fullWidth label="Name" name="name" type="text" max={60} />
      <SelectField fullWidth label="Type" name="type" values={TYPE_OPTIONS} />
      <RecurrencePicker budget={budget} />
      <PeriodListMutable />
      <RolloverPicker />
    </>
  );
};

const CategoryDetailsView = ({ category }: { category: Category }) => (
  <>
    <SidebarItem title="Type">{categoryTitle(category.type)}</SidebarItem>
    <SidebarItem title="Amount">
      <MoneyText variant="inherit" amount={categoryActual(category)} />
      &nbsp;of&nbsp;
      <MoneyText variant="inherit" amount={categoryNominal(category)} />
    </SidebarItem>
    {category.recurrence.type !== RecurrenceType.None && (
      <SidebarItem title="Recurrence">
        <MoneyText variant="inherit" amount={category.recurrence.amount} />
        &nbsp;
        {recurrenceSummary(category)}
      </SidebarItem>
    )}
    <PeriodList category={category} />
  </>
);

/* ================================================================================================================= *
 * Sidebar                                                                                                           *
 * ================================================================================================================= */

type CategorySidebarProps = {
  budget: Budget;
  category: Category;
  open: boolean;
  onClose: () => void;
  onUpdate: (category: Category) => void;
  onDelete: () => void;
};

export const CategorySidebar = ({ budget, category, open, onClose, onUpdate, onDelete }: CategorySidebarProps) => {
  const [editState, setEditState] = useState(EditState.View);
  const { putCategory, deleteCategory } = useApi();

  const [deleteModal, setDeleteModal] = useState(false);
  const openModal = useCallback(() => setDeleteModal(true), []);
  const closeModal = useCallback(() => setDeleteModal(false), []);

  const handleDelete = async () => {
    await deleteCategory(budget.id, category.id);
    onDelete();
  };

  useEffect(() => {
    if (open) {
      setEditState(EditState.View);
      if (!category.id) setEditState(EditState.Edit);
    }
  }, [open, category]);

  return (
    <Sidebar
      open={open}
      onClose={onClose}
      FormProps={{
        enableReinitialize: true,
        initialValues: category,
        validationSchema: Yup.object({
          name: Yup.string().trim().required("You must provide a name!"),
        }),
        async onSubmit(category) {
          category = await putCategory(budget.id, category);
          setEditState(EditState.View);
          setDeleteModal(false);
          onUpdate(category);
        },
      }}
    >
      {(formik) => (
        <>
          <SidebarHeader onClose={onClose}>
            {editState !== EditState.Edit
              ? category.name
              : category.id
              ? formik.values.name
              : formik.values.name || "New Category"}
          </SidebarHeader>

          <DeleteDialog
            open={deleteModal}
            title={`Delete category ${category.name}?`}
            desc={"This will delete this category and any transactions associated with it."}
            onClose={closeModal}
            onDelete={handleDelete}
          />

          <Scrollbar sx={{ flexGrow: 1 }}>
            <Stack spacing={3} sx={{ p: 3 }}>
              {editState === EditState.Edit && <CategoryEditView budget={budget} />}
              {editState !== EditState.Edit && <CategoryDetailsView category={category} />}
              <EditActions
                allowDelete={!!category.id}
                dirty={categoryDirty(formik.values, category)}
                state={editState}
                onStateChanged={setEditState}
                onDelete={openModal}
              />
            </Stack>
          </Scrollbar>
        </>
      )}
    </Sidebar>
  );
};
