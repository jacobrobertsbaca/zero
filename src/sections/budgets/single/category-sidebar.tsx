import {
  Stack,
  Drawer,
  Divider,
  IconButton,
  Typography,
  SvgIcon,
} from '@mui/material';
import XMarkIcon from '@heroicons/react/24/solid/XMarkIcon';
import { Scrollbar } from 'src/components/scrollbar';
import { Category, Recurrence, RecurrenceType } from 'src/types/category/types';
import { categoryActual, categoryNominal, categoryTitle } from 'src/types/category/methods';
import { moneyFormat } from 'src/types/money/methods';

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
        sx: { width: { xs: 1, sm: 500 }, border: 'none', overflow: 'hidden' },
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
          <Stack>
            <Typography variant="subtitle1">
              Type
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {categoryTitle(category.type)}
            </Typography>
          </Stack>
          <Stack>
            <Typography variant="subtitle1">
              Amount
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {moneyFormat(categoryActual(category))} of {moneyFormat(categoryNominal(category))}
            </Typography>
          </Stack>
        </Stack>
      </Scrollbar>
    </Drawer>
  );
}