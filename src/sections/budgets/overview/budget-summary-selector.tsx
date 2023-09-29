import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import ChevronUpIcon from "@heroicons/react/24/solid/ChevronUpIcon";
import { Button, Menu, MenuItem, SvgIcon, Typography } from "@mui/material";
import { useState } from "react";

export enum BudgetSummaryState {
  Current = "current",
  Total = "total"
};

const OPTIONS = [
  { value: BudgetSummaryState.Current, label: 'Current' },
  { value: BudgetSummaryState.Total, label: 'Total' },
];

type BudgetSummarySelectorProps = {
  value: BudgetSummaryState,
  onChange: (state: BudgetSummaryState) => void
};

export const BudgetSummarySelector = ({ value, onChange }: BudgetSummarySelectorProps) => {
  const [open, setOpen] = useState(null);

  const handleOpen = (event: any) => {
    setOpen(event.currentTarget);
  };

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLElement>,
    index: number,
  ) => {
    onChange(OPTIONS[index].value);
    setOpen(null);
  };

  const handleClose = () => {
    setOpen(null);
  };

  return (
    <>
      <Button
        color="inherit"
        disableRipple
        onClick={handleOpen}
        endIcon={<SvgIcon>{open ? <ChevronUpIcon /> : <ChevronDownIcon />}</SvgIcon>}
      >
        <Typography component="span" variant="subtitle2" color="text.secondary">
          {OPTIONS.find(o => o.value === value)?.label}
        </Typography>
      </Button>
      <Menu
        keepMounted
        anchorEl={open}
        open={!!open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {OPTIONS.map((option, index) => (
          <MenuItem
            key={option.value}
            selected={option.value === value}
            onClick={(event) => handleMenuItemClick(event, index)}
            sx={{ typography: 'body2' }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}