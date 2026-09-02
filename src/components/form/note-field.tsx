import { Parser } from "expr-eval";
import { FormikValues, useFormikContext } from "formik";
import { get } from "lodash";
import { useCallback, useRef, useState } from "react";
import { Field } from "src/components/ui/field";
import { Textarea } from "src/components/ui/textarea";
import { cn } from "src/utils";

type NoteFieldProps = {
  name: string;
  label?: React.ReactNode;
  max?: number;
  rows?: number;
  placeholder?: string;
  className?: string;
};

type Suggestion = { at: number; completion: string };

const hasOperator = (s: string) => /[+*/()]/.test(s) || /^-?.+-/.test(s);

const formatResult = (n: number, usedDollar: boolean) => {
  const cents = Math.round(n * 100);
  const body = cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
  return usedDollar ? `$${body}` : body;
};

const getSuggestion = (text: string, cursor: number): Suggestion | null => {
  const prefix = text.slice(0, cursor).replace(/\s+$/, "");
  if (!/[=:]$/.test(prefix)) return null;

  let i = prefix.length - 2;
  while (i >= 0 && /[0-9.$+\-*/()\s]/.test(prefix[i]!)) i--;
  const body = prefix.slice(i + 1, -1).trim();
  if (!body || !hasOperator(body)) return null;

  // Spaces/$ around operators collapse; remaining spaces/$ separate values — use the last segment.
  const collapsed = body.replace(/[\s$]*([+\-*/()])[\s$]*/g, "$1");
  const rawLast = collapsed.split(/\s+/).pop()!;
  const segment = rawLast
    .split(/(?=\$)/)
    .filter(Boolean)
    .pop()!;
  const usedDollar = segment.includes("$");
  const forEval = segment.replace(/\$/g, "");
  if (!forEval || !hasOperator(forEval) || !/^[0-9.\-+*/()]+$/.test(forEval)) return null;

  try {
    const result = Parser.evaluate(forEval);
    if (typeof result !== "number" || !Number.isFinite(result)) return null;
    return { at: cursor, completion: formatResult(result, usedDollar) };
  } catch {
    return null;
  }
};

export const NoteField = <T extends FormikValues>({
  name,
  label,
  max = 1000,
  rows = 5,
  placeholder,
  className,
}: NoteFieldProps) => {
  const formik = useFormikContext<T>();
  const value = (get(formik.values, name) as string) ?? "";
  const error = get(formik.touched, name) && get(formik.errors, name);
  const errorText = typeof error === "string" ? error : error ? JSON.stringify(error) : undefined;
  const [cursor, setCursor] = useState(0);
  const suggestion = getSuggestion(value, cursor);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const syncCursor = useCallback((el: HTMLTextAreaElement) => {
    setCursor(el.selectionStart ?? 0);
  }, []);

  const accept = useCallback(() => {
    if (!suggestion) return;
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(suggestion.at, suggestion.at);
      // Deprecated, but still the only reliable way to insert into a textarea's undo stack.
      if (
        document.queryCommandSupported?.("insertText") &&
        document.execCommand("insertText", false, suggestion.completion)
      ) {
        setCursor(suggestion.at + suggestion.completion.length);
        return;
      }
    }
    const next = value.slice(0, suggestion.at) + suggestion.completion + value.slice(suggestion.at);
    formik.setFieldValue(name, next);
    const caret = suggestion.at + suggestion.completion.length;
    setCursor(caret);
    requestAnimationFrame(() => el?.setSelectionRange(caret, caret));
  }, [suggestion, value, formik, name]);

  return (
    <Field label={label} htmlFor={name} error={!!error} helperText={error ? errorText : `${value.length}/${max}`}>
      <div className="relative w-full">
        <Textarea
          ref={textareaRef}
          id={name}
          name={name}
          rows={rows}
          placeholder={placeholder}
          maxLength={max}
          autoComplete="off"
          value={value}
          onBlur={formik.handleBlur}
          onChange={(event) => {
            formik.handleChange(event);
            syncCursor(event.currentTarget);
          }}
          onKeyDown={(event) => {
            if (suggestion && event.key === "Tab") {
              event.preventDefault();
              accept();
            }
          }}
          onKeyUp={(event) => syncCursor(event.currentTarget)}
          onClick={(event) => syncCursor(event.currentTarget)}
          onSelect={(event) => syncCursor(event.currentTarget)}
          className={cn(error && "border-destructive", className)}
        />
        {suggestion && (
          <button
            type="button"
            tabIndex={-1}
            className="absolute bottom-2 right-2 rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
            onPointerDown={(event) => event.preventDefault()}
            onClick={accept}
          >
            {suggestion.completion}
          </button>
        )}
      </div>
    </Field>
  );
};
