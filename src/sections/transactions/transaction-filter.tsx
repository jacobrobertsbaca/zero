import { Chip, IconButton, SvgIcon } from "@mui/material";

import { neutral } from "src/theme/colors";

import FilterIcon from "@heroicons/react/24/solid/AdjustmentsHorizontalIcon";
import { DateString } from "src/types/utils/types";
import { Money } from "src/types/money/types";
import { Budget } from "src/types/budget/types";
import { ReadonlyURLSearchParams } from "next/navigation";
import { moneyFormat, MoneyFormatOptions, moneyParse } from "src/types/money/methods";
import { DateStringSchema, IdSchema } from "src/types/utils/schema";
import { useMemo, useState } from "react";
import { Stack } from "@mui/system";
import { dateFormatShort } from "src/types/utils/methods";
import { TransactionFilter } from "src/types/transaction/types";
import { Sidebar } from "src/components/sidebar/sidebar";
import { z } from "zod";
import { MoneySchema } from "src/types/money/schema";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { FormMoneyField } from "src/components/form/money-field";
import { EditActions, EditState } from "src/components/sidebar/edit-actions";
import { isEqual } from "lodash";
import { DateField } from "src/components/form/date-field";

export type TransactionFilterModel = {
  dateMin: DateString | null /* start in URL */;
  dateMax: DateString | null /* end in URL */;
  amountMin: Money | null /* min in URL */;
  amountMax: Money | null /* max in URL */;

  /** An array of budget IDs to filter by. This is disjunctive, and disjunctive with category. */
  budget: string[] /* budget in URL */;

  /** An array of category IDs to filter by. This is disjunctive, and disjunctive with budget. */
  category: string[] /* category in URL */;
};

export const filterModelToFilters = (model: TransactionFilterModel): TransactionFilter | undefined => {
  const filters: TransactionFilter[] = [];

  if (model.dateMin) filters.push({ type: "column", column: "date", filter: "gte", value: model.dateMin });
  if (model.dateMax) filters.push({ type: "column", column: "date", filter: "lte", value: model.dateMax });
  if (model.amountMin) filters.push({ type: "column", column: "amount", filter: "gte", value: model.amountMin.amount });
  if (model.amountMax) filters.push({ type: "column", column: "amount", filter: "lte", value: model.amountMax.amount });

  if (model.budget.length > 0 || model.category.length > 0) {
    const subFilters: TransactionFilter[] = [];
    model.budget.forEach((id) => subFilters.push({ type: "column", column: "budget", filter: "eq", value: id }));
    model.category.forEach((id) => subFilters.push({ type: "column", column: "category", filter: "eq", value: id }));
    filters.push({ type: "or", filters: subFilters });
  }

  if (filters.length === 0) return undefined;
  return { type: "and", filters };
};

/* ================================================================================================================= *
 * URLSearchParams Handling                                                                                          *
 * ================================================================================================================= */

export const encodeFilterModel = (filter: TransactionFilterModel, params: URLSearchParams): void => {
  if (!filter) return;

  const format: MoneyFormatOptions = { excludeSymbol: true };
  if (filter.dateMin) params.set("start", filter.dateMin);
  if (filter.dateMax) params.set("end", filter.dateMax);
  if (filter.amountMin) params.set("min", moneyFormat(filter.amountMin, format));
  if (filter.amountMax) params.set("max", moneyFormat(filter.amountMax, format));
  filter.budget.forEach((id) => params.append("budget", id));
  filter.category.forEach((id) => params.append("category", id));
};

const parseParam = <T,>(param: string | null, parser: (value: string) => T): T | null => {
  if (param === null) return null;
  try {
    return parser(param);
  } catch (err) {
    console.warn("Failed to parse filter parameter. Got error: ", err);
  }

  return null;
};

/**
 * Decodes a filter model from the URL search params.
 * @param params    Params to decode.
 * @param budgets   Budgets to use for decoding.
 *                  Needed in order to strip non-existent IDs.
 * @returns         The decoded filter model.
 */
export const decodeFilterModel = (
  params: ReadonlyURLSearchParams,
  budgets: readonly Budget[] | undefined
): TransactionFilterModel => {
  const dateMin = parseParam(params.get("start"), DateStringSchema.parse);
  const dateMax = parseParam(params.get("end"), DateStringSchema.parse);
  const amountMin = parseParam(params.get("min"), moneyParse);
  const amountMax = parseParam(params.get("max"), moneyParse);

  let budget = params.getAll("budget");
  let category = params.getAll("category");

  /* If budgets are available, strip out any non-existent IDs. */
  if (budgets) {
    const allBudgets = new Set(budgets.map((b) => b.id));
    const allCategories = new Set(budgets.flatMap((b) => b.categories.map((c) => c.id)));
    budget = budget.filter((id) => allBudgets.has(id));
    category = category.filter((id) => allCategories.has(id));
  }

  return { dateMin, dateMax, amountMin, amountMax, budget, category };
};

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
      <IconButton
        sx={{
          /** We want the button style to match the MuiFilledInput style so it matches
           * the search bar. These styles are copied from the MuiFilledInput style.
           */
          borderRadius: "8px",
          border: `1px solid ${neutral[200]}`,
        }}
        disabled={!budgets}
        onClick={() => setOpen(true)}
      >
        <SvgIcon>
          <FilterIcon />
        </SvgIcon>
      </IconButton>
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

const TransactionFilterSidebar = ({ open, onClose, filter, setFilter }: TransactionFilterSidebarProps) => {
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
          <Stack direction="row" spacing={1}>
            <FormMoneyField fullWidth name="amountMin" label="Minimum" />
            <FormMoneyField fullWidth name="amountMax" label="Maximum" />
          </Stack>
          <Stack direction="row" spacing={1}>
            <DateField name="dateMin" label="From" />
            <DateField name="dateMax" label="Until" />
          </Stack>
          <EditActions
            state={EditState.Edit}
            dirty={!isEqual(form.values, filter)}
            onDelete={() => {
              setFilter({
                dateMin: null,
                dateMax: null,
                amountMin: null,
                amountMax: null,
                budget: [],
                category: [],
              });
              onClose();
            }}
            ButtonProps={{
              submit: { children: "Apply Filters" },
              delete: { children: "Clear Filters", startIcon: null },
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
};

export const TransactionFilterChips = ({ filter, setFilter, budgets }: TransactionFilterChipsProps) => {
  const chips = useMemo(() => getFilterChips(4, filter, budgets), [filter, budgets]);
  if (chips.length === 0) return null;
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
      {chips.map((chip) => (
        <Chip
          key={chip.id ?? chip.label}
          variant="outlined"
          size="small"
          onDelete={chip.onDelete ? () => chip.onDelete && setFilter(chip.onDelete(filter)) : undefined}
          label={chip.label}
        />
      ))}
    </Stack>
  );
};
