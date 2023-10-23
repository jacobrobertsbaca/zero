import { Drawer, Stack } from "@mui/material";
import { FormikValues } from "formik";
import { Form, FormProps } from "../form/form";

type SidebarProps<T extends FormikValues> = {
  open: boolean;
  onClose: () => void;
  children?: FormProps<T>["children"];
  FormProps?: Omit<FormProps<T>, "children">;
};

export const Sidebar = <T extends FormikValues>({ open, onClose, children, FormProps }: SidebarProps<T>) => {
  FormProps = FormProps
    ? { sx: { height: 1, overflow: "hidden", ...FormProps.sx }, ...FormProps }
    : {
        initialValues: {} as T,
        onSubmit(values: T) {},
      };
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: 1, sm: 500 }, border: "none", overflow: "hidden" },
      }}
    >
      <Form {...FormProps}>
        {(formik) => (
          <Stack height={1} sx={{ overflow: "hidden" }}>
            {typeof children === "function" ? children(formik) : children}
          </Stack>
        )}
      </Form>
    </Drawer>
  );
};
