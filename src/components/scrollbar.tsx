import { cn } from "src/utils";

type ScrollbarProps = {
  children: React.ReactNode;
  className?: string;
};

export const Scrollbar = ({ children, className }: ScrollbarProps) => (
  <div className={cn("overflow-y-auto overflow-x-hidden", className)}>{children}</div>
);
