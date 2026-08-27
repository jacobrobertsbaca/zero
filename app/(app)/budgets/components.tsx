"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "src/components/ui/button";
import { BudgetSidebar } from "src/sections/budgets/common/budget-sidebar";
import { Dates } from "src/types/utils/types";
import { cn } from "src/utils";

const emptyBudget = {
  id: "",
  name: "",
  dates: { begin: null, end: null } as unknown as Dates,
  categories: [],
};

function NewBudgetSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();

  return (
    <BudgetSidebar
      budget={emptyBudget}
      open={open}
      onClose={onClose}
      onUpdate={(budget) => {
        router.push(`/budgets/${budget.id}`);
        return false;
      }}
    />
  );
}

export function NewBudgetButton() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
        <Plus />
        <span className="sr-only">New Budget</span>
      </Button>
      <NewBudgetSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}

export function AddBudgetCard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Add budget"
        onClick={() => setSidebarOpen(true)}
        className={cn(
          "flex h-full min-h-[4.75rem] flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-input/70 bg-card text-card-foreground shadow-sm",
          "cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40"
        )}
      >
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Plus className="size-3.5 shrink-0" />
          Add a budget
        </div>
      </button>
      <NewBudgetSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
