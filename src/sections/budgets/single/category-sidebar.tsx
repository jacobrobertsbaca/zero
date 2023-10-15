import { Stack, Drawer, Divider, IconButton, Typography, SvgIcon } from "@mui/material";
import XMarkIcon from "@heroicons/react/24/solid/XMarkIcon";
import { Scrollbar } from "src/components/scrollbar";
import { Category, CategoryType, RecurrenceType } from "src/types/category/types";
import { categoryActual, categoryDirty, categoryNominal, categoryTitle } from "src/types/category/methods";
import { PeriodList } from "./period-list";
import { MoneyText } from "src/components/money-text";
import { CategoryEditActions, CategoryEditState } from "./category-edit-actions";
import { useEffect, useState } from "react";

import { useForm } from "src/hooks/use-form";
import * as Yup from "yup";
import { TextField } from "src/components/form/text-field";
import { FormikProps } from "formik";
import { SelectField } from "src/components/form/select-field";
import { MoneyField } from "src/components/form/money-field";

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

const CategoryEditView = ({ form }: { form: FormikProps<Category> }) => (
  <>
    <TextField fullWidth label="Name" name="name" type="text" />
    <SelectField fullWidth label="Type" name="type" values={TYPE_OPTIONS} />
  </>
);

const CategoryDetailsView = ({ category }: { category: Category}) => (
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
  category: Category;
  open: boolean;
  onClose: () => void;
};

export const CategorySidebar = ({ category, open, onClose }: CategorySidebarProps) => {
  const [editState, setEditState] = useState(CategoryEditState.View);
  const [draft, setDraft] = useState<Category>(category);

  useEffect(() => {
    if (open) {
      setEditState(CategoryEditState.View);
      setDraft(category);
    }
  }, [open, category]);

  /* Form for editting category */
  const Form = useForm({
    initialValues: category,
    validationSchema: Yup.object({
      password: Yup.string().label("Password").max(255).min(8).optional(),
      passwordConfirmed: Yup.string().oneOf([Yup.ref("password")], "Passwords must match!"),
    }),
    async onSubmit(values, helpers) {},
  });

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: 1, sm: 500 }, border: "none", overflow: "hidden" },
      }}
    >
      <Form sx={{ display: "block", height: 1 }}>
        {(formik) => (
          <Stack height={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 2 }}>
              <Typography variant="subtitle1" sx={{ ml: 1 }}>
                {editState !== CategoryEditState.Edit ? draft.name : formik.values.name }
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
                {editState === CategoryEditState.Edit && <CategoryEditView form={formik} />}
                {editState !== CategoryEditState.Edit && <CategoryDetailsView category={category} />}
              </Stack>
            </Scrollbar>

            <Divider />

            <CategoryEditActions
              category={draft}
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
