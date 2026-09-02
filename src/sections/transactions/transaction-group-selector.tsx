import { ChevronDown, ChevronRight, ChevronsUpDown, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Budget } from "src/types/budget/types";
import { Category } from "src/types/category/types";
import { Field } from "src/components/ui/field";
import { Badge } from "src/components/ui/badge";
import { Checkbox } from "src/components/ui/checkbox";
import { Input } from "src/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "src/components/ui/popover";
import { cn } from "src/utils";

type CategoryOption = {
  budget: Budget;
  category: Category;
};

export type TransactionGroupSelectorProps = {
  options: readonly Budget[];
  categories: string[];
  budgets: string[];
  onChange: (categories: string[], budgets: string[]) => void;
  label?: React.ReactNode;
  className?: string;
};

const matchesInput = (option: CategoryOption, input: string): boolean => {
  if (!input) return true;
  const q = input.toLowerCase();
  return (
    option.category.name.toLowerCase().includes(q) ||
    option.budget.name.toLowerCase().includes(q) ||
    option.category.type.toLowerCase().includes(q)
  );
};

export const TransactionGroupSelector = ({
  options,
  categories,
  budgets,
  onChange,
  label,
  className,
}: TransactionGroupSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(new Set<string>());
  const [input, setInput] = useState("");

  const flatOptions = useMemo(() => {
    return options.flatMap((budget) => budget.categories.map((category) => ({ budget, category })));
  }, [options]);

  const filteredOptions = useMemo(() => flatOptions.filter((option) => matchesInput(option, input)), [flatOptions, input]);

  const value: CategoryOption[] = useMemo(() => {
    const value: CategoryOption[] = [];
    const categorySet = new Set(categories);

    for (const budget of budgets) {
      const budgetOptions = flatOptions.filter((option) => option.budget.id === budget);
      for (const option of budgetOptions) {
        categorySet.delete(option.category.id);
        value.push(option);
      }
    }

    for (const category of categorySet) {
      const option = flatOptions.find((option) => option.category.id === category);
      if (option) value.push(option);
    }

    return value;
  }, [categories, budgets, flatOptions]);

  const applyValue = useCallback(
    (newValue: CategoryOption[]) => {
      const categorySet = new Set(newValue.map((option) => option.category.id));
      const budgetIds: string[] = [];
      for (const budget of options) {
        const budgetCategories = budget.categories.map((category) => category.id);
        if (budgetCategories.length > 0 && budgetCategories.every((category) => categorySet.has(category))) {
          budgetIds.push(budget.id);
          for (const category of budgetCategories) categorySet.delete(category);
        }
      }
      onChange(Array.from(categorySet), budgetIds);
    },
    [options, onChange]
  );

  const toggleCategory = useCallback(
    (option: CategoryOption, checked: boolean) => {
      const newValue = checked ? [...value, option] : value.filter((v) => v.category.id !== option.category.id);
      applyValue(newValue);
    },
    [value, applyValue]
  );

  const selectBudget = useCallback(
    (budget: Budget, selected: boolean) => {
      const budgetSet = new Set(budgets);
      const budgetCategories = new Set(budget.categories.map((category) => category.id));
      const categorySet = new Set(categories);

      if (!selected) {
        budgetSet.delete(budget.id);
        budgetCategories.forEach((category) => categorySet.delete(category));
      } else {
        const choices = filteredOptions.filter((option) => option.budget.id === budget.id);

        if (choices.length === budget.categories.length) {
          budgetSet.add(budget.id);
          budgetCategories.forEach((category) => categorySet.delete(category));
        } else {
          budgetSet.delete(budget.id);
          choices.forEach((option) => categorySet.add(option.category.id));
        }
      }

      onChange(Array.from(categorySet), Array.from(budgetSet));
    },
    [budgets, categories, filteredOptions, onChange]
  );

  const toggleGroup = useCallback((budgetId: string, next: boolean) => {
    setOpenGroups((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(budgetId);
      else copy.delete(budgetId);
      return copy;
    });
  }, []);

  const budgetSelected = useMemo(() => new Set(budgets), [budgets]);
  const renderedBudgets = useMemo(() => {
    const rendered = new Set<string>();
    const chips: React.ReactNode[] = [];
    for (const option of value) {
      if (budgetSelected.has(option.budget.id)) {
        if (rendered.has(option.budget.id)) continue;
        rendered.add(option.budget.id);
        chips.push(
          <Badge key={option.budget.id} variant="secondary" className="gap-1 font-normal">
            {option.budget.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                selectBudget(option.budget, false);
              }}
            >
              <X className="size-3" />
            </button>
          </Badge>
        );
      } else {
        chips.push(
          <Badge key={option.category.id} variant="secondary" className="gap-1 font-normal">
            {option.category.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory(option, false);
              }}
            >
              <X className="size-3" />
            </button>
          </Badge>
        );
      }
    }
    return chips;
  }, [value, budgetSelected, selectBudget, toggleCategory]);

  const groupBudgets = useMemo(() => {
    if (!input) return options;
    const visible = new Set(filteredOptions.map((o) => o.budget.id));
    return options.filter((b) => visible.has(b.id));
  }, [options, input, filteredOptions]);

  return (
    <Field label={label} className={className}>
      <Popover
        modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setInput("");
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm"
            )}
          >
            {renderedBudgets.length > 0 ? renderedBudgets : <span className="text-muted-foreground">Any category</span>}
            <ChevronsUpDown className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="z-[60] w-[var(--radix-popover-trigger-width)] p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="border-b p-2">
            <Input
              autoFocus
              placeholder="Search categories..."
              value={input}
              onChange={(e) => {
                const next = e.target.value;
                setInput(next);
                if (next === "") setOpenGroups(new Set());
                else {
                  const matches = flatOptions.filter((option) => matchesInput(option, next));
                  setOpenGroups(new Set(matches.map((option) => option.budget.id)));
                }
              }}
            />
          </div>
          <div className="max-h-72 overflow-y-auto overscroll-contain p-1">
            {groupBudgets.length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">No categories found</div>
            )}
            {groupBudgets.map((budget) => {
              const groupOptions = filteredOptions.filter((option) => option.budget.id === budget.id);
              const isOpen = openGroups.has(budget.id);
              const selected: boolean | "indeterminate" = budgetSelected.has(budget.id)
                ? true
                : budget.categories.some((c) => categories.includes(c.id))
                  ? "indeterminate"
                  : false;

              return (
                <div key={budget.id}>
                  <div
                    className="flex cursor-pointer items-center gap-1.5 rounded-sm px-1.5 py-1.5 text-sm hover:bg-accent"
                    onClick={() => toggleGroup(budget.id, !isOpen)}
                  >
                    {isOpen ? (
                      <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <Checkbox
                      checked={selected}
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={(checked) => selectBudget(budget, !!checked)}
                    />
                    <span className="truncate">{budget.name}</span>
                  </div>
                  {isOpen && (
                    <div className="ml-8 flex flex-col">
                      {groupOptions.map((option) => (
                        <label
                          key={option.category.id}
                          className="flex cursor-pointer items-center gap-1.5 rounded-sm px-1.5 py-1.5 text-sm hover:bg-accent"
                        >
                          <Checkbox
                            checked={budgetSelected.has(budget.id) || categories.includes(option.category.id)}
                            onCheckedChange={(checked) => toggleCategory(option, !!checked)}
                          />
                          <span className="truncate">{option.category.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  );
};
