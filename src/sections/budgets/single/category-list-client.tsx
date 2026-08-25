"use client";

import { Plus } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { produce } from "immer";
import { TimelineChart } from "../common/timeline-chart";
import { SpendingBar } from "../common/spending-bar";
import { CategorySidebar } from "./category-sidebar";
import { categoryActual, categoryDefault, categoryNominal, categoryTitle } from "src/types/category/methods";
import { Category, CategoryType } from "src/types/category/types";
import { Budget, CumulativeTimeline } from "src/types/budget/types";
import { cn } from "src/utils";

const CategoryClickContext = createContext<(category: Category) => void>(() => {});

export function CategoryTimelineChart({
  timeline,
  limit,
  warn,
}: {
  timeline: CumulativeTimeline;
  limit: number;
  warn: boolean;
}) {
  return (
    <TimelineChart
      begin={timeline.begin}
      end={timeline.end}
      points={timeline.points}
      limit={limit}
      compact
      mono={!warn}
      splitAt={warn ? limit : 0}
      warnAbove={warn}
    />
  );
}

export function CategoryCard({ category, children }: { category: Category; children: React.ReactNode }) {
  const onClick = useContext(CategoryClickContext);
  const actual = categoryActual(category);
  const nominal = categoryNominal(category);

  return (
    <button
      type="button"
      onClick={() => onClick(category)}
      className={cn(
        "flex flex-col overflow-hidden rounded-md border border-input bg-card text-left text-card-foreground shadow-sm",
        "cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40"
      )}
    >
      <div className="flex items-start justify-between gap-3 px-3 pt-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{category.name}</div>
          <div className="text-xs text-muted-foreground">{categoryTitle(category.type)}</div>
        </div>
        <SpendingBar
          actual={actual}
          nominal={nominal}
          remaining
          warn={category.type !== CategoryType.Income}
          bar={false}
        />
      </div>
      <div className="mt-1 w-full px-3 pb-3">
        <div className="h-10 w-full overflow-visible">{children}</div>
      </div>
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
            "flex h-full min-h-[6.5rem] flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-input bg-card text-card-foreground shadow-sm",
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
