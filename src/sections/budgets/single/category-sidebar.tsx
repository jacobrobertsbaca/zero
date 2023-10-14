import { Stack, Drawer, Divider, IconButton, Typography, SvgIcon } from "@mui/material";
import XMarkIcon from "@heroicons/react/24/solid/XMarkIcon";
import { Scrollbar } from "src/components/scrollbar";
import { Category, RecurrenceType } from "src/types/category/types";
import { categoryActual, categoryNominal, categoryTitle } from "src/types/category/methods";
import { PeriodList } from "./period-list";
import { MoneyText } from "src/components/money-text";

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
 * Sidebar                                                                                                           *
 * ================================================================================================================= */

type CategorySidebarProps = {
  category: Category;
  open: boolean;
  onClose: () => void;
};

export const CategorySidebar = ({ category, open, onClose }: CategorySidebarProps) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: 1, sm: 500 }, border: "none", overflow: "hidden" },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 2 }}>
        <Typography variant="subtitle1" sx={{ ml: 1 }}>
          {category.name}
        </Typography>
        <IconButton onClick={onClose}>
          <SvgIcon>
            <XMarkIcon />
          </SvgIcon>
        </IconButton>
      </Stack>

      <Divider />

      <Scrollbar>
        <Stack spacing={3} sx={{ p: 3 }}>
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
        </Stack>
      </Scrollbar>
    </Drawer>
  );
};
