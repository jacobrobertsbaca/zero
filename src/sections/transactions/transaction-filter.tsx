import { X } from "lucide-react";

import { Budget } from "src/types/budget/types";
import { moneyFormat } from "src/types/money/methods";
import { DateStringSchema, IdSchema } from "src/types/utils/schema";
import { useMemo, useState } from "react";
import { dateFormatShort } from "src/types/utils/methods";
import { Sidebar } from "src/components/sidebar/sidebar";
import { z } from "zod";
import { MoneySchema } from "src/types/money/schema";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { FormMoneyField } from "src/components/form/money-field";
import { EditActions, EditState } from "src/components/sidebar/edit-actions";
import { isEqual } from "lodash";
import { DateField } from "src/components/form/date-field";
import { TransactionGroupSelector } from "./transaction-group-selector";
import { Badge, badgeVariants } from "src/components/ui/badge";
import { cn } from "src/utils";
import { emptyFilters, type TransactionFilterModel } from "./transaction-filter-model";

export {
  decodeFilterModel,
  emptyFilters,
  encodeFilterModel,
  filterModelToFilters,
  type SearchParamsLike,
  type TransactionFilterModel,
} from "./transaction-filter-model";

/* ================================================================================================================= *
 * Transaction Filter Sidebar                                                                                        *
 * ================================================================================================================= */

export type TransactionFilterButtonProps = {
  filter: TransactionFilterModel;
  setFilter: (filter: TransactionFilterModel) => void;
  budgets?: readonly Budget[];
};

export const TransactionFilterButton = ({ budgets, ...rest }: TransactionFilterButtonProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        disabled={!budgets}
        onClick={() => setOpen(true)}
        className={cn(
          badgeVariants({ variant: "outline" }),
          "border-dashed font-normal text-muted-foreground disabled:pointer-events-none disabled:opacity-50"
        )}
      >
        + Add Filter
      </button>
      {budgets !== undefined && (
        <TransactionFilterSidebar {...rest} budgets={budgets} open={open} onClose={() => setOpen(false)} />
      )}
    </>
  );
};

const FilterSchema = z.object({
  amountMin: MoneySchema.nullable(),
  amountMax: MoneySchema.nullable(),
  dateMin: DateStringSchema.nullable(),
  dateMax: DateStringSchema.nullable(),
  category: IdSchema.array(),
  budget: IdSchema.array(),
});

export type TransactionFilterSidebarProps = Omit<TransactionFilterButtonProps, "budgets"> & {
  budgets: NonNullable<TransactionFilterButtonProps["budgets"]>;
  open: boolean;
  onClose: () => void;
};

const TransactionFilterSidebar = ({ budgets, open, onClose, filter, setFilter }: TransactionFilterSidebarProps) => {
  return (
    <Sidebar
      open={open}
      onClose={onClose}
      title="Edit Filters"
      FormProps={{
        enableReinitialize: true,
        initialValues: filter,
        validationSchema: toFormikValidationSchema(FilterSchema),
        onSubmit(values) {
          setFilter(values);
          onClose();
        },
      }}
    >
      {(form) => (
        <>
          <div className="flex gap-2">
            <FormMoneyField fullWidth name="amountMin" label="Minimum" />
            <FormMoneyField fullWidth name="amountMax" label="Maximum" />
          </div>
          <div className="flex gap-2">
            <DateField name="dateMin" label="From" />
            <DateField name="dateMax" label="Until" />
          </div>
          <TransactionGroupSelector
            options={budgets}
            label="Category"
            budgets={form.values.budget}
            categories={form.values.category}
            onChange={(categories, budgets) => {
              form.setFieldValue("category", categories);
              form.setFieldValue("budget", budgets);
            }}
          />
          <EditActions
            state={EditState.Edit}
            dirty={!isEqual(form.values, filter)}
            onDelete={() => {
              setFilter(emptyFilters());
              onClose();
            }}
            ButtonProps={{
              submit: { children: "Apply Filters" },
              delete: { children: "Clear Filters" },
            }}
          />
        </>
      )}
    </Sidebar>
  );
};

/* ================================================================================================================= *
 * Filter Chips                                                                                                      *
 * ================================================================================================================= */

type TransactionFilterChip = {
  id?: string;
  label: string;
  onDelete?: (model: TransactionFilterModel) => TransactionFilterModel;
};

const getFilterChips = (
  maxChips: number,
  filter: TransactionFilterModel,
  budgets?: readonly Budget[]
): TransactionFilterChip[] => {
  let chips: TransactionFilterChip[] = [];

  if (filter.amountMin || filter.amountMax) {
    let label: string = "";
    if (filter.amountMin && filter.amountMax) {
      label = `${moneyFormat(filter.amountMin)} — ${moneyFormat(filter.amountMax)}`;
    } else if (filter.amountMin) {
      label = `≥ ${moneyFormat(filter.amountMin)}`;
    } else if (filter.amountMax) {
      label = `≤ ${moneyFormat(filter.amountMax)}`;
    }

    chips.push({
      label,
      onDelete: (model) => ({ ...model, amountMin: null, amountMax: null }),
    });
  }

  if (filter.dateMin || filter.dateMax) {
    let label: string = "";
    const min = filter.dateMin ? dateFormatShort(filter.dateMin) : "";
    const max = filter.dateMax ? dateFormatShort(filter.dateMax) : "";
    if (filter.dateMin && filter.dateMax) {
      label = `${min} — ${max}`;
    } else if (filter.dateMin) {
      label = `From ${min}`;
    } else if (filter.dateMax) {
      label = `Until ${max}`;
    }

    chips.push({
      label,
      onDelete: (model) => ({ ...model, dateMin: null, dateMax: null }),
    });
  }

  for (const id of filter.budget) {
    const name = budgets?.find((b) => b.id === id)?.name;
    if (!name) continue;
    chips.push({
      id,
      label: name,
      onDelete: (model) => ({ ...model, budget: model.budget.filter((b) => b !== id) }),
    });
  }

  for (const id of filter.category) {
    const name = budgets?.flatMap((b) => b.categories).find((c) => c.id === id)?.name;
    if (!name) continue;
    chips.push({
      id,
      label: name,
      onDelete: (model) => ({ ...model, category: model.category.filter((c) => c !== id) }),
    });
  }

  if (chips.length > maxChips) {
    const length = chips.length;
    chips = chips.slice(0, maxChips);
    chips.push({ label: `${length - maxChips} more` });
  }

  return chips;
};

export type TransactionFilterChipsProps = {
  filter: TransactionFilterModel;
  setFilter: (filter: TransactionFilterModel) => void;
  budgets?: readonly Budget[];
  children?: React.ReactNode;
};

export const TransactionFilterChips = ({ filter, setFilter, budgets, children }: TransactionFilterChipsProps) => {
  const chips = useMemo(() => getFilterChips(4, filter, budgets), [filter, budgets]);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <Badge key={chip.id ?? chip.label} variant="outline" className="gap-1 font-normal">
          {chip.label}
          {chip.onDelete && (
            <button type="button" onClick={() => chip.onDelete && setFilter(chip.onDelete(filter))}>
              <X className="size-3" />
            </button>
          )}
        </Badge>
      ))}
      {children}
    </div>
  );
};
