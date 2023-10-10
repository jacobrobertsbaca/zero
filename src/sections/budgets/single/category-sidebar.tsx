import { Stack, Drawer, Divider, IconButton, Typography, SvgIcon } from "@mui/material";
import XMarkIcon from "@heroicons/react/24/solid/XMarkIcon";
import { Scrollbar } from "src/components/scrollbar";
import { Category, Recurrence, RecurrenceType } from "src/types/category/types";
import { categoryActual, categoryNominal, categoryTitle } from "src/types/category/methods";
import { moneyFormat } from "src/types/money/methods";
import { Budget } from "src/types/budget/types";
import { PeriodList } from "./period-list";

/* ================================================================================================================= *
 * Utility                                                                                                           *
 * ================================================================================================================= */

const recurrenceSummary = (category: Category): string => {
  const amount = moneyFormat(category.recurrence.amount);
  switch (category.recurrence.type) {
    case RecurrenceType.None:
      return `${amount} overall`;
    case RecurrenceType.Monthly:
      return `${amount} monthly on day ${category.recurrence.day}`;
    case RecurrenceType.Weekly:
      return `${amount} weekly on ${
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
  budget: Budget;
  category: Category;
  open: boolean;
  onClose: () => void;
};

export const CategorySidebar = ({ budget, category, open, onClose }: CategorySidebarProps) => {
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
            {moneyFormat(categoryActual(category))} of {moneyFormat(categoryNominal(category))}
          </SidebarItem>
          {category.recurrence.type !== RecurrenceType.None && (
            <SidebarItem title="Recurrence">{recurrenceSummary(category)}</SidebarItem>
          )}
          <PeriodList budget={budget} category={category} />
        </Stack>
      </Scrollbar>
    </Drawer>
  );
};
