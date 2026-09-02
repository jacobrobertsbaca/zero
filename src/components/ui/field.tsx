import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "src/utils";
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
      <AnimatePresence initial={false}>
        {helperText ? (
          <motion.p
            key="helper-text"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn("overflow-hidden text-xs", error ? "text-destructive" : "text-muted-foreground")}
          >
            {helperText}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
