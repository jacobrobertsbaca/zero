import { format } from "date-fns";
import { FormikValues, useFormikContext } from "formik";
import { CalendarIcon } from "lucide-react";
import { get } from "lodash";
import { useCallback } from "react";
import { Button } from "src/components/ui/button";
import { Calendar } from "src/components/ui/calendar";
import { Field } from "src/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "src/components/ui/popover";
import { cn } from "src/utils";
import { asDate, asDateString } from "src/types/utils/methods";

type DateFieldProps = {
  name: string;
  label?: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

export const DateField = <T extends FormikValues>(props: DateFieldProps) => {
  const { name, label, className, disabled } = props;
  const { touched, errors, values, setFieldValue, setFieldTouched } = useFormikContext<T>();
  const error = get(touched, name) && get(errors, name);
  const errorText = typeof error === "string" ? error : error ? JSON.stringify(error) : undefined;

  const raw = get(values, name);
  const dateValue: Date | undefined = raw ? asDate(raw) : undefined;

  const onSelect = useCallback(
    (value: Date | undefined) => {
      setFieldTouched(name, true);
      if (!value) setFieldValue(name, null);
      else if (value instanceof Date && isFinite(value.valueOf())) setFieldValue(name, asDateString(value));
      else setFieldValue(name, null);
    },
    [name, setFieldValue, setFieldTouched]
  );

  return (
    <Field label={label} error={!!error} helperText={errorText} className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start font-normal",
              !dateValue && "text-muted-foreground",
              error && "border-destructive"
            )}
            onBlur={() => setFieldTouched(name, true)}
          >
            <CalendarIcon className="size-4 opacity-60" />
            {dateValue ? format(dateValue, "MMM d, yyyy") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={dateValue} onSelect={onSelect} autoFocus />
        </PopoverContent>
      </Popover>
    </Field>
  );
};
