"use client";

import { Plus } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { produce } from "immer";
import { MoneyText } from "src/components/money-text";
import { CategorySidebar } from "./category-sidebar";
import { categoryActual, categoryDefault, categoryNominal, categoryTitle } from "src/types/category/methods";
import { Category } from "src/types/category/types";
import { Budget } from "src/types/budget/types";
import { moneyAbs, moneyFactor, moneySub, RoundingMode } from "src/types/money/methods";
import { Money } from "src/types/money/types";
import { cn } from "src/utils";

function RemainingLabel({ actual, nominal }: { actual: Money; nominal: Money }) {
  const delta = moneySub(nominal, actual);
  const left = nominal.amount >= 0 ? delta.amount >= 0 : delta.amount < 0;
  const amount = nominal.amount >= 0 ? moneyAbs(delta) : moneyFactor(moneyAbs(delta), -1);

  return (
    <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
      <MoneyText amount={amount} round={RoundingMode.RoundZero} />
      &nbsp;
      {left ? "left" : "over"}
    </span>
  );
}

function utilization(actual: Money, nominal: Money) {
  const a = actual.amount;
  const n = nominal.amount;
  if (n === 0) return a !== 0 ? 1 : 0;
  if (a === 0 || Math.sign(a) !== Math.sign(n)) return 0;
  return Math.min(1, Math.abs(a) / Math.abs(n));
}

function isOverBudget(actual: Money, nominal: Money) {
  const a = actual.amount;
  const n = nominal.amount;
  if (n === 0) return a !== 0;
  if (a === 0 || Math.sign(a) !== Math.sign(n)) return false;
  return Math.abs(a) > Math.abs(n);
}

const CategoryClickContext = createContext<(category: Category) => void>(() => {});

export function CategoryCard({ category }: { category: Category }) {
  const onClick = useContext(CategoryClickContext);
  const actual = categoryActual(category);
  const nominal = categoryNominal(category);
  const hasTarget = nominal !== null;
  const ratio = hasTarget ? utilization(actual, nominal) : 0;
  const pct = Math.min(100, ratio * 100);
  const over = hasTarget && isOverBudget(actual, nominal);

  return (
    <button
      type="button"
      onClick={() => onClick(category)}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-md border border-input/70 bg-card text-left text-card-foreground shadow-sm",
        "cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40",
        hasTarget && "border-b-0"
      )}
    >
      <div className="flex flex-1 items-start justify-between gap-3 px-3.5 py-3.5">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{category.name}</div>
          <div className="text-xs text-muted-foreground">{categoryTitle(category.type)}</div>
        </div>
        <div className="flex min-w-0 shrink-0 flex-col items-end gap-0.5">
          <span className="whitespace-nowrap text-xs tabular-nums">
            <span className="font-medium text-foreground">
              <MoneyText amount={actual} round={RoundingMode.RoundZero} />
            </span>
          </span>
          {hasTarget && <RemainingLabel actual={actual} nominal={nominal} />}
        </div>
      </div>
      {hasTarget && (
        <div
          className="mt-auto h-[3px] w-full bg-success/15"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${category.name} utilization`}
        >
          <div
            className={cn("progress-enter h-full origin-left rounded-sm", over ? "bg-destructive/80" : "bg-success/80")}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </button>
  );
}

export function CategoryListClient({ budget, children }: { budget: Budget; children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCategory, setSidebarCategory] = useState(categoryDefault());

  const onCategoryClicked = useCallback((category: Category) => {
    setSidebarCategory(category);
    setSidebarOpen(true);
  }, []);

  const onAddCategory = useCallback(() => {
    /* This is a small hack. In order for Formik to reset form state, it
     * uses deep equality on the initial values. By seeding a random value to
     * category._, we ensure that the form state gets reset
     */
    const category = categoryDefault(budget);
    onCategoryClicked(
      produce(category, (draft) => {
        (draft as any)._ = Math.random();
      })
    );
  }, [budget, onCategoryClicked]);

  return (
    <CategoryClickContext.Provider value={onCategoryClicked}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {children}
        <button
          type="button"
          aria-label="Add category"
          onClick={onAddCategory}
          className={cn(
            "flex h-full min-h-[4.75rem] flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-input/70 bg-card text-card-foreground shadow-sm",
            "cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40"
          )}
        >
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Plus className="size-3.5 shrink-0 " />
            Add a category
          </div>
        </button>
      </div>
      <CategorySidebar
        open={sidebarOpen}
        budget={budget}
        category={sidebarCategory}
        onClose={() => setSidebarOpen(false)}
        onUpdate={(category) => {
          setSidebarCategory(category);
          router.refresh();
        }}
        onDelete={() => {
          setSidebarOpen(false);
          router.refresh();
        }}
      />
    </CategoryClickContext.Provider>
  );
}
