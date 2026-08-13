"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "src/components/ui/button";
import { BudgetSidebar } from "src/sections/budgets/common/budget-sidebar";
import { Dates } from "src/types/utils/types";

export function NewBudgetButton() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
        <Plus />
        <span className="sr-only">New Budget</span>
      </Button>
      <BudgetSidebar
        budget={{
          id: "",
          name: "",
          dates: { begin: null, end: null } as unknown as Dates,
          categories: [],
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onUpdate={(budget) => {
          router.push(`/budgets/${budget.id}`);
          return false;
        }}
      />
    </>
  );
}
