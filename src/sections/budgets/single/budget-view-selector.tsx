import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import ChevronUpIcon from "@heroicons/react/24/solid/ChevronUpIcon";
import { Button, Menu, MenuItem, SvgIcon, Typography } from "@mui/material";
import { SyntheticEvent, useState } from "react";

export enum BudgetView {
  Current = "current",
  Total = "total"
};

const OPTIONS = [
  { value: BudgetView.Current, label: 'Current' },
  { value: BudgetView.Total, label: 'Total' },
];

type BudgetViewSelectorProps = {
  value: BudgetView;
  onChange: (state: BudgetView) => void;
  anchor?: Element | null;
  onAnchorChange?: (anchor: Element | null) => void;
};

export const BudgetViewSelector = ({ value, onChange, anchor, onAnchorChange }: BudgetViewSelectorProps) => {
  const [ownAnchor, setOwnAnchor] = useState<Element | null>(null);
  if (!anchor) anchor = ownAnchor;
  if (!onAnchorChange) onAnchorChange = setOwnAnchor;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();
    onAnchorChange!(event.currentTarget);
  };

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLElement>,
    index: number,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    onChange(OPTIONS[index].value);
    onAnchorChange!(null);
  };

  const handleClose = () => {
    onAnchorChange!(null);
  };

  return (
    <>
      <Button
        color="inherit"
        disableRipple
        onClick={handleOpen}
        onTouchStart={event => event.stopPropagation()}
        onMouseDown={event => event.stopPropagation()}
        endIcon={<SvgIcon>{anchor ? <ChevronUpIcon /> : <ChevronDownIcon />}</SvgIcon>}
      >
        <Typography component="span" variant="subtitle2" color="text.secondary">
          {OPTIONS.find(o => o.value === value)?.label}
        </Typography>
      </Button>
      <Menu
        keepMounted
        anchorEl={anchor}
        open={!!anchor}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {OPTIONS.map((option, index) => (
          <MenuItem
            key={option.value}
            selected={option.value === value}
            onClick={(event) => handleMenuItemClick(event, index)}
            onTouchStart={event => event.stopPropagation()}
            onMouseDown={event => event.stopPropagation()}
            sx={{ typography: 'body2' }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}