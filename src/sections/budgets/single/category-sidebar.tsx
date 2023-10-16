import { Stack, Drawer, Divider, IconButton, Typography, SvgIcon, styled } from "@mui/material";
import XMarkIcon from "@heroicons/react/24/solid/XMarkIcon";
import { Scrollbar } from "src/components/scrollbar";
import { Category, CategoryType, RecurrenceType, RolloverMode } from "src/types/category/types";
import {
  categoryActual,
  categoryDirty,
  categoryNominal,
  categoryTitle,
  onCategoryNominal,
} from "src/types/category/methods";
import { PeriodList } from "./period-list";
import { MoneyText } from "src/components/money-text";
import { CategoryEditActions, CategoryEditState } from "./category-edit-actions";
import { useEffect, useState } from "react";

import { TextField } from "src/components/form/text-field";
import { FormikProps } from "formik";
import { SelectField } from "src/components/form/select-field";
import { MoneyField } from "src/components/form/money-field";
import { Form } from "src/components/form/form";
import { PeriodListMutable } from "./period-list-mutable";
import { RecurrencePicker } from "./recurrence-picker";
import { Budget } from "src/types/budget/types";
import { RolloverPicker } from "./rollover-picker";

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

const CategoryEditView = ({ budget, form }: { budget: Budget, form: FormikProps<Category> }) => {
  /* Reset the form on unmount */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => form.resetForm(), []);

  return (
    <>
      <TextField fullWidth label="Name" name="name" type="text" />
      <SelectField fullWidth label="Type" name="type" values={TYPE_OPTIONS} />
      <MoneyField
        fullWidth
        label="Total"
        value={categoryNominal(form.values)}
        onChange={(total) => form.setValues(onCategoryNominal(form.values, total))}
      />
      <RecurrencePicker budget={budget} form={form} />

      <PeriodListMutable form={form} />

      <RolloverPicker form={form} />
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
};

export const CategorySidebar = ({ budget, category, open, onClose }: CategorySidebarProps) => {
  const [editState, setEditState] = useState(CategoryEditState.View);

  useEffect(() => {
    if (open) setEditState(CategoryEditState.View);
  }, [open, category]);

  return (
    <Drawer
      keepMounted
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: 1, sm: 500 }, border: "none", overflow: "hidden" },
      }}
    >
      <Form enableReinitialize initialValues={category} onSubmit={() => {}} sx={{ height: 1, overflow: "hidden" }}>
        {(formik) => (
          <Stack height={1} sx={{ overflow: "hidden" }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 2 }}>
              <Typography variant="subtitle1" sx={{ ml: 1 }}>
                {editState !== CategoryEditState.Edit ? category.name : formik.values.name}
              </Typography>
              <IconButton onClick={onClose}>
                <SvgIcon>
                  <XMarkIcon />
                </SvgIcon>
              </IconButton>
            </Stack>

            <Divider />

            <Scrollbar sx={{ flexGrow: 1 }}>
              <Stack spacing={3} sx={{ p: 3 }}>
                {editState === CategoryEditState.Edit && <CategoryEditView budget={budget} form={formik} />}
                {editState !== CategoryEditState.Edit && <CategoryDetailsView category={category} />}
              </Stack>
            </Scrollbar>

            <Divider />

            <CategoryEditActions
              category={category}
              state={editState}
              onStateChanged={setEditState}
              dirty={categoryDirty(category, formik.values)}
            />
          </Stack>
        )}
      </Form>
    </Drawer>
  );
};
