import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "src/components/ui/tooltip";

type InfoTooltipProps = {
  title: React.ReactNode;
  className?: string;
};

export const InfoTooltip = ({ title, className }: InfoTooltipProps) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={className}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
        >
          <Info className="size-4 text-muted-foreground" />
          <span className="sr-only">Info</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        {title}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
