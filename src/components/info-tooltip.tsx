import InformationCircleIcon from "@heroicons/react/24/outline/InformationCircleIcon";
import { SvgIcon, Tooltip, TooltipProps } from "@mui/material";

export const InfoTooltip = (props: Omit<TooltipProps, "children">) =>
  (
    <Tooltip 
      placement="top" 
      arrow 
      enterTouchDelay={0} 
      onClick={event => event.stopPropagation()}
      onMouseDown={event => event.stopPropagation()}
      {...props}
    >
      <SvgIcon 
        fontSize="small" 
        color="disabled" 
        onTouchStart={event => event.stopPropagation()}>
        <InformationCircleIcon />
      </SvgIcon>
    </Tooltip>
  );