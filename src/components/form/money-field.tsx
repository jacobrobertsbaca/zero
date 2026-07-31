import { FormikValues, useFormikContext } from "formik";
import { isEqual } from "lodash";
import { ChangeEvent, InputHTMLAttributes, useCallback, useEffect, useRef, useState } from "react";
import { Field } from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "src/components/ui/popover";
import { useMediaQuery } from "src/hooks/use-media-query";
import { cn } from "src/lib/utils";
import { moneyFormat, moneyParse, moneyParseExpression } from "src/types/money/methods";
import { Money } from "src/types/money/types";

const maskCurrency = (prev: string, current: string) => (/^[0-9.\-+*/() ]*$/.test(current) ? current : prev);

const isExpr = (v: string) => /[+*/()]/.test(v) || /^-?.+-/.test(v.trim());

export type MoneyFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size"> & {
  value: Money | null;
  onChange: (value: Money | null) => void;
  label?: React.ReactNode;
  error?: boolean;
  helperText?: React.ReactNode;
  fullWidth?: boolean;
};

export const MoneyField = (props: MoneyFieldProps) => {
  const { value, onChange, onBlur, onFocus, label, error, helperText, className, fullWidth, id, name, ...rest } = props;
  const [rawInput, setRawInput] = useState("");
  const [focused, setFocused] = useState(false);
  const lastValue = useRef<Money | null>();
  const inputRef = useRef<HTMLInputElement>(null);
  const mobile = !useMediaQuery("(min-width: 640px)");
  const preview = focused && isExpr(rawInput) ? moneyParseExpression(rawInput) : null;

  const commit = useCallback(
    (next: string) => {
      if (!next.trim()) {
        lastValue.current = null;
        onChange(null);
        return;
      }
      const money = moneyParse(next.trim());
      if (money) {
        lastValue.current = money;
        onChange(money);
      }
    },
    [onChange]
  );

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setRawInput((prev) => {
        const next = maskCurrency(prev, event.target.value);
        commit(next);
        return next;
      });
    },
    [commit]
  );

  const onInputBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const raw = rawInput;
      window.setTimeout(() => {
        setFocused(false);
        const money = moneyParseExpression(raw);
        lastValue.current = money;
        onChange(money);
        setRawInput(money ? moneyFormat(money, { keepZero: true, excludeSymbol: true }) : "");
        onBlur?.(event);
      }, 0);
    },
    [rawInput, onChange, onBlur]
  );

  useEffect(() => {
    if (isEqual(value, lastValue.current)) return;
    if (value === null) setRawInput("");
    else setRawInput(moneyFormat(value, { keepZero: true, excludeSymbol: true }));
    lastValue.current = value;
  }, [value]);

  return (
    <Field label={label} htmlFor={id ?? name} error={error} helperText={helperText}>
      <Popover open={focused && mobile} modal={false}>
        <PopoverAnchor asChild>
          <div className={cn("relative", fullWidth !== false && "w-full")}>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              ref={inputRef}
              id={id ?? name}
              name={name}
              inputMode="decimal"
              autoComplete="off"
              onChange={onInputChange}
              onFocus={(e) => {
                setFocused(true);
                onFocus?.(e);
              }}
              onBlur={onInputBlur}
              value={rawInput}
              className={cn("pl-7", preview && "pr-16", error && "border-destructive", className)}
              {...rest}
            />
            {preview && (
              <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                {moneyFormat(preview)}
              </span>
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="z-[60] flex w-auto gap-0.5 p-1"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {"+-*/()".split("").map((op) => (
            <button
              key={op}
              type="button"
              tabIndex={-1}
              className="flex size-7 items-center justify-center rounded-md text-sm text-muted-foreground active:bg-muted"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                const el = inputRef.current;
                const start = el?.selectionStart ?? rawInput.length;
                const end = el?.selectionEnd ?? rawInput.length;
                const next = maskCurrency(rawInput, rawInput.slice(0, start) + op + rawInput.slice(end));
                setRawInput(next);
                commit(next);
                requestAnimationFrame(() => el?.setSelectionRange(start + 1, start + 1));
              }}
            >
              {op === "*" ? "×" : op === "/" ? "÷" : op === "-" ? "−" : op}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </Field>
  );
};

export type FormMoneyFieldProps = Omit<MoneyFieldProps, "value" | "onChange" | "name"> & {
  name: string;
  onChange?: (value: Money | null) => void;
  value?: Money | null;
};

export const FormMoneyField = <T extends FormikValues>(props: FormMoneyFieldProps) => {
  const { name, onChange, value, helperText, ...rest } = props;
  const formik = useFormikContext<T>();
  const formMeta = formik.getFieldMeta(name);
  const formValue = (value ?? formMeta.value) as Money | null;
  const formError = (formMeta.touched && formMeta.error) || undefined;

  const onFieldChange = useCallback(
    (next: Money | null) => {
      formik.setFieldValue(name, next);
      onChange?.(next);
    },
    [formik, name, onChange]
  );

  return (
    <MoneyField
      name={name}
      value={formValue}
      onChange={onFieldChange}
      error={!!formError}
      helperText={formError ?? helperText}
      onBlur={formik.handleBlur}
      {...rest}
    />
  );
};
