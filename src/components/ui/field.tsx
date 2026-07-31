import * as React from "react";
import { cn } from "src/lib/utils";
import { Label } from "src/components/ui/label";

type FieldProps = {
  label?: React.ReactNode;
  htmlFor?: string;
  error?: boolean;
  helperText?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

export function Field({ label, htmlFor, error, helperText, className, children }: FieldProps) {
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {label != null && label !== false && (
        <Label htmlFor={htmlFor} className={cn(error && "text-destructive")}>
          {label}
        </Label>
      )}
      {children}
      {helperText ? (
        <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>{helperText}</p>
      ) : null}
    </div>
  );
}
