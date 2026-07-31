import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "src/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "src/components/ui/dropdown-menu";

export enum BudgetView {
  Current = "current",
  Total = "total",
}

const OPTIONS = [
  { value: BudgetView.Current, label: "Current" },
  { value: BudgetView.Total, label: "Total" },
];

type BudgetViewSelectorProps = {
  value: BudgetView;
  onChange: (state: BudgetView) => void;
};

export const BudgetViewSelector = ({ value, onChange }: BudgetViewSelectorProps) => {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto gap-1 px-1.5 py-0 text-xs font-medium text-muted-foreground shadow-none hover:bg-transparent hover:text-muted-foreground data-[state=open]:bg-transparent"
          onClick={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          {OPTIONS.find((o) => o.value === value)?.label}
          {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={(event) => {
              event.stopPropagation();
              onChange(option.value);
            }}
            onTouchStart={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            className={option.value === value ? "bg-accent" : undefined}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
