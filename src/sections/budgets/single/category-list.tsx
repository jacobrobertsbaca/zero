"use client";

import { Move, Plus } from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { reorderCategories } from "src/server/actions";

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

function CategoryCard({
  category,
  reorderable,
  onOpen,
  onDragEnd,
}: {
  category: Category;
  reorderable: boolean;
  onOpen: () => void;
  onDragEnd: () => void;
}) {
  const controls = useDragControls();
  const actual = categoryActual(category);
  const nominal = categoryNominal(category);
  const hasTarget = nominal !== null;
  const ratio = hasTarget ? utilization(actual, nominal) : 0;
  const pct = Math.min(100, ratio * 100);
  const over = hasTarget && isOverBudget(actual, nominal);

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    controls.start(e);
  };

  return (
    <Reorder.Item
      as="div"
      value={category.id}
      dragListener={false}
      dragControls={controls}
      onDragEnd={reorderable ? onDragEnd : undefined}
      className="group relative h-full list-none select-none"
      style={{ position: "relative" }}
    >
      {/* Desktop: hover pop-in at top-left when reordering is available */}
      <div
        aria-label="Drag to reorder"
        aria-hidden={!reorderable}
        className={cn(
          "absolute -left-1.5 -top-1.5 z-10 hidden size-6 origin-top-left items-center justify-center rounded-full border border-input/70 bg-card text-muted-foreground/50 shadow-sm transition-all duration-150 md:flex",
          reorderable
            ? "scale-75 cursor-grab touch-none select-none opacity-0 hover:text-muted-foreground active:cursor-grabbing group-hover:scale-100 group-hover:opacity-100"
            : "pointer-events-none scale-75 opacity-0"
        )}
        onPointerDown={reorderable ? startDrag : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <Move className="size-3" strokeWidth={1.75} />
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-md border border-input/70 bg-card text-left text-card-foreground shadow-sm",
          "cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40",
          hasTarget && "border-b-0"
        )}
      >
        <div className="flex flex-1 flex-col justify-center gap-0.5 px-3.5 py-3.5">
          <div className="flex items-baseline justify-between gap-3">
            <div className="truncate text-sm font-medium">{category.name}</div>
            <span className="shrink-0 whitespace-nowrap text-xs tabular-nums font-medium text-foreground">
              <MoneyText amount={actual} round={RoundingMode.RoundZero} />
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <div className="truncate text-xs text-muted-foreground">{categoryTitle(category.type)}</div>
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
              className={cn(
                "progress-enter h-full origin-left rounded-sm",
                over ? "bg-destructive/80" : "bg-success/80"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    </Reorder.Item>
  );
}

export function CategoryList({ budget }: { budget: Budget }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCategory, setSidebarCategory] = useState(categoryDefault());
  const [orderedIds, setOrderedIds] = useState(() => budget.categories.map((c) => c.id));
  const orderedIdsRef = useRef(orderedIds);
  orderedIdsRef.current = orderedIds;

  useEffect(() => {
    setOrderedIds(budget.categories.map((c) => c.id));
  }, [budget.categories]);

  const categoriesById = useMemo(
    () => new Map(budget.categories.map((category) => [category.id, category])),
    [budget.categories]
  );

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
    <>
      <Reorder.Group
        as="div"
        axis="xy"
        values={orderedIds}
        onReorder={setOrderedIds}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3"
      >
        {orderedIds.map((id) => {
          const category = categoriesById.get(id);
          if (!category) return null;
          return (
            <CategoryCard
              key={id}
              category={category}
              reorderable={orderedIds.length > 1}
              onOpen={() => onCategoryClicked(category)}
              onDragEnd={() => reorderCategories(budget.id, orderedIdsRef.current)}
            />
          );
        })}
        <button
          type="button"
          aria-label="Add category"
          onClick={onAddCategory}
          className={cn(
            "flex h-full min-h-[4.25rem] flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-input/70 bg-card text-card-foreground shadow-sm",
            "cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40"
          )}
        >
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Plus className="size-3.5 shrink-0" />
            Add a category
          </div>
        </button>
      </Reorder.Group>
      <CategorySidebar
        open={sidebarOpen}
        budget={budget}
        category={sidebarCategory}
        onClose={() => setSidebarOpen(false)}
        onUpdate={(category) => {
          setSidebarCategory(category);
        }}
        onDelete={() => {
          setSidebarOpen(false);
        }}
      />
    </>
  );
}
