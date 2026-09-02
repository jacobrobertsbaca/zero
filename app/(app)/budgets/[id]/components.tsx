"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "src/components/ui/button";
import { BudgetSidebar } from "src/sections/budgets/common/budget-sidebar";
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
