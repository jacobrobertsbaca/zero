import { cn } from "src/utils";

export const PageTitle = ({ title, className }: { title: string; className?: string }) => (
  <h1 className={cn("text-2xl font-semibold tracking-tight text-foreground", className)}>{title}</h1>
);
