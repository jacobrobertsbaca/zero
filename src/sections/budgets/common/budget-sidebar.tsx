import { Stack } from "@mui/material";
import { Form } from "formik";
import { TextField } from "src/components/form/text-field";
import { Scrollbar } from "src/components/scrollbar";
import { Sidebar } from "src/components/sidebar/sidebar";
import { SidebarHeader } from "src/components/sidebar/sidebar-header";
import { Budget } from "src/types/budget/types";

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
        async onSubmit(values) {},
      }}
    >
      {(form) => (
        <>
          <SidebarHeader onClose={onClose}>Edit Budget Details</SidebarHeader>

          <Scrollbar sx={{ flexGrow: 1 }}>
            <Stack spacing={3} sx={{ p: 3 }}>
              <TextField fullWidth label="Name" name="name" type="text" />
            </Stack>
          </Scrollbar>
        </>
      )}
    </Sidebar>
  );
};
