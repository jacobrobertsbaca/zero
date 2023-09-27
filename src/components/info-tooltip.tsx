import InformationCircleIcon from "@heroicons/react/24/outline/InformationCircleIcon";
import { SvgIcon, Tooltip, TooltipProps } from "@mui/material";

export const InfoTooltip = (props: Omit<TooltipProps, "children">) =>
  (
    <Tooltip placement="top" arrow enterTouchDelay={0} {...props}>
      <SvgIcon fontSize="inherit" color="disabled">
        <InformationCircleIcon />
      </SvgIcon>
    </Tooltip>
  );