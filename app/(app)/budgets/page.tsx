import { Suspense } from "react";
import { listBudgets } from "src/server/common";
import BudgetCard from "src/sections/budgets/overview/budget-card";
import { BudgetGrid } from "src/sections/budgets/overview/budget-grid";
import { userId } from "src/utils/supabase/server";
import { AddBudgetCard, NewBudgetButton } from "./components";

export const metadata = {
  title: "Budgets",
};

async function BudgetsList() {
  const owner = await userId();
  const budgets = await listBudgets(owner);

  return (
    <BudgetGrid actions={<NewBudgetButton />} dropdown={budgets.length > 0}>
      {budgets.length === 0 && <AddBudgetCard />}
      {budgets.map((b) => (
        <BudgetCard key={b.id} budget={b} />
      ))}
    </BudgetGrid>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<BudgetGrid actions={<NewBudgetButton />} dropdown={false} loading />}>
      <BudgetsList />
    </Suspense>
  );
}
