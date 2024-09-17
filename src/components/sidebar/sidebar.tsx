import { FormikValues } from "formik";
import { Form, FormProps } from "../form/form";

import { Box, Divider, IconButton, Drawer, Stack, SvgIcon, Typography } from "@mui/material";
import XMarkIcon from "@heroicons/react/24/solid/XMarkIcon";
import { Scrollbar } from "../scrollbar";

type SidebarHeaderProps = {
  onClose: () => void;
  children: React.ReactNode;
};

const SidebarHeader = ({ onClose, children }: SidebarHeaderProps) => (
  <Box>
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 2 }}>
      <Typography variant="subtitle1" sx={{ ml: 1 }}>
        {children}
      </Typography>
      <IconButton onClick={onClose}>
        <SvgIcon>
          <XMarkIcon />
        </SvgIcon>
      </IconButton>
    </Stack>

    <Divider />
  </Box>
);

type SidebarProps<T extends FormikValues> = {
  open: boolean;
  onClose: () => void;
  children?: FormProps<T>["children"];
  FormProps?: Omit<FormProps<T>, "children">;
  title?: FormProps<T>["children"];
};

export const Sidebar = <T extends FormikValues>({ open, onClose, children, FormProps, title }: SidebarProps<T>) => {
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
            <SidebarHeader onClose={onClose}>{typeof title === "function" ? title(formik) : title}</SidebarHeader>
            <Scrollbar sx={{ flexGrow: 1 }}>
              <Stack spacing={2} sx={{ p: 3 }}>
                {typeof children === "function" ? children(formik) : children}
              </Stack>
            </Scrollbar>
          </Stack>
        )}
      </Form>
    </Drawer>
  );
};
