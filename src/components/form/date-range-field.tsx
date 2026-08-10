import { format } from "date-fns";
import { FormikValues, useFormikContext } from "formik";
import { CalendarIcon } from "lucide-react";
import { get } from "lodash";
import type { DateRange } from "react-day-picker";
import { Button } from "src/components/ui/button";
import { Calendar } from "src/components/ui/calendar";
import { Field } from "src/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "src/components/ui/popover";
import { cn } from "src/utils";
import { asDate, asDateString } from "src/types/utils/methods";

type DateRangeFieldProps = {
  name: string;
  label?: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

export const DateRangeField = <T extends FormikValues>({
  name,
  label,
  className,
  disabled,
}: DateRangeFieldProps) => {
  const { touched, errors, values, setFieldValue, setFieldTouched } = useFormikContext<T>();

  const beginError = get(touched, `${name}.begin`) && get(errors, `${name}.begin`);
  const endError = get(touched, `${name}.end`) && get(errors, `${name}.end`);
  const errorText = [endError, beginError].find((e) => typeof e === "string") as string | undefined;

  const from = get(values, `${name}.begin`) ? asDate(get(values, `${name}.begin`)) : undefined;
  const to = get(values, `${name}.end`) ? asDate(get(values, `${name}.end`)) : undefined;

  return (
    <Field label={label} error={!!(beginError || endError)} helperText={errorText} className={className}>
      <Popover
        onOpenChange={(open) => {
          if (!open) {
            setFieldTouched(`${name}.begin`, true);
            setFieldTouched(`${name}.end`, true);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start font-normal",
              !from && "text-muted-foreground",
              (beginError || endError) && "border-destructive"
            )}
          >
            <CalendarIcon className="size-4 opacity-60" />
            {from && to
              ? `${format(from, "MMM d, yyyy")} — ${format(to, "MMM d, yyyy")}`
              : from
                ? `${format(from, "MMM d, yyyy")} — …`
                : "Pick a date range"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={from || to ? { from, to } : undefined}
            defaultMonth={from}
            autoFocus
            onSelect={(range: DateRange | undefined) => {
              setFieldValue(`${name}.begin`, range?.from ? asDateString(range.from) : null);
              setFieldValue(`${name}.end`, range?.to ? asDateString(range.to) : null);
            }}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
};
