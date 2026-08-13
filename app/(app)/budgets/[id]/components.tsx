"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "src/components/ui/button";
import { BudgetSidebar } from "src/sections/budgets/common/budget-sidebar";
import { CategoryList } from "src/sections/budgets/single/category-list";
import { CategorySidebar } from "src/sections/budgets/single/category-sidebar";
import { categoryDefault } from "src/types/category/methods";
import { Category } from "src/types/category/types";
import { Budget } from "src/types/budget/types";

export function EditBudgetButton({ budget }: { budget: Budget }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Pencil />
        <span className="sr-only">Edit Budget</span>
      </Button>
      <BudgetSidebar
        budget={budget}
        open={open}
        onClose={() => setOpen(false)}
        onUpdate={() => {
          router.refresh();
        }}
        onDelete={() => router.replace("/budgets")}
      />
    </>
  );
}

export function BudgetCategories({ budget }: { budget: Budget }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCategory, setSidebarCategory] = useState(categoryDefault());

  const onCategoryClicked = useCallback((category: Category) => {
    setSidebarCategory(category);
    setSidebarOpen(true);
  }, []);

  return (
    <>
      <CategoryList budget={budget} onCategoryClicked={onCategoryClicked} />
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
    </>
  );
}
