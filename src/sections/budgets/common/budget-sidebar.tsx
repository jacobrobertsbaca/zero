import { Stack } from "@mui/material";
import { DateField } from "src/components/form/date-field";
import { TextField } from "src/components/form/text-field";
import { Scrollbar } from "src/components/scrollbar";
import { Sidebar } from "src/components/sidebar/sidebar";
import { SidebarHeader } from "src/components/sidebar/sidebar-header";
import { Budget } from "src/types/budget/types";
import * as Yup from "yup";

type BudgetSidebarProps = {
  budget: Budget;
  open: boolean;
  onClose: () => void;
};

export const BudgetSidebar = ({ budget, open, onClose }: BudgetSidebarProps) => {
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

          <Scrollbar sx={{ flexGrow: 1 }}>
            <Stack spacing={3} sx={{ p: 3 }}>
              <TextField fullWidth label="Name" name="name" type="text" />
              <DateField label="Begin" name="dates.begin" />
              <DateField label="End" name="dates.end" />
            </Stack>
          </Scrollbar>
        </>
      )}
    </Sidebar>
  );
};
