import PropTypes from 'prop-types';
// @mui
import {
  Box,
  Radio,
  Stack,
  Button,
  Drawer,
  Rating,
  Divider,
  Checkbox,
  FormGroup,
  IconButton,
  Typography,
  RadioGroup,
  FormControlLabel,
  SvgIcon,
} from '@mui/material';
import XMarkIcon from '@heroicons/react/24/solid/XMarkIcon';
import { Scrollbar } from 'src/components/scrollbar';
import { Category } from 'src/types/category/types';
import { categoryActual, categoryNominal, categoryTitle } from 'src/types/category/methods';
import { moneyFormat } from 'src/types/money/methods';

// ----------------------------------------------------------------------

export const SORT_BY_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'priceDesc', label: 'Price: High-Low' },
  { value: 'priceAsc', label: 'Price: Low-High' },
];
export const FILTER_GENDER_OPTIONS = ['Men', 'Women', 'Kids'];
export const FILTER_CATEGORY_OPTIONS = ['All', 'Shose', 'Apparel', 'Accessories'];
export const FILTER_RATING_OPTIONS = ['up4Star', 'up3Star', 'up2Star', 'up1Star'];
export const FILTER_PRICE_OPTIONS = [
  { value: 'below', label: 'Below $25' },
  { value: 'between', label: 'Between $25 - $75' },
  { value: 'above', label: 'Above $75' },
];
export const FILTER_COLOR_OPTIONS = [
  '#00AB55',
  '#000000',
  '#FFFFFF',
  '#FFC0CB',
  '#FF4842',
  '#1890FF',
  '#94D82D',
  '#FFC107',
];

// ----------------------------------------------------------------------

type CategorySidebarProps = {
  category: Category | null;
  onClose: () => void;
};

export const CategorySidebar = ({ category, onClose }: CategorySidebarProps) => {
  return (
    <Drawer
      anchor="right"
      open={!!category}
      onClose={onClose}
      PaperProps={{
        sx: { width: 500, border: 'none', overflow: 'hidden' },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 2 }}>
        <Typography variant="subtitle1" sx={{ ml: 1 }}>
          {category?.name}
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
              {category && categoryTitle(category.type)}
            </Typography>
          </Stack>
          <Stack>
            <Typography variant="subtitle1">
              Amount
            </Typography>
            {category &&
              <Typography variant="subtitle2" color="text.secondary">
                {moneyFormat(categoryActual(category))} of {moneyFormat(categoryNominal(category))}
              </Typography>
            }
          </Stack>
        </Stack>
      </Scrollbar>
    </Drawer>
  );
}