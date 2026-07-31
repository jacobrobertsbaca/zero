import { Plus } from "lucide-react";
import { Budget, BudgetStatus } from "src/types/budget/types";
import { BudgetViewSelector, BudgetView } from "./budget-view-selector";
import { useCallback, useState } from "react";
import {
  categoryActiveIndex,
  categoryActual,
  categoryDefault,
  categoryNominal,
  categoryRollover,
  categoryTitle,
} from "src/types/category/methods";
import { SpendingBar } from "../common/spending-bar";
import { Category, CategoryType } from "src/types/category/types";
import { budgetStatus } from "src/types/budget/methods";
import { PeriodTooltip } from "../common/period-tooltip";
import { moneySum } from "src/types/money/methods";

import { produce } from "immer";

type CategoryRowProps = {
  state: BudgetView;
  category: Category;
  onClick: (category: Category) => void;
};

const CategoryRow = ({ state, category, onClick }: CategoryRowProps) => {
  const activeIndex = categoryActiveIndex(category);
  const activePeriod = category.periods[activeIndex];
  const rollovers = categoryRollover(category);
  const actual = state === BudgetView.Current ? activePeriod!.actual : categoryActual(category);
  const nominal =
    state === BudgetView.Current ? moneySum(activePeriod!.nominal, rollovers[activeIndex]) : categoryNominal(category);

  return (
    <tr
      key={category.id}
      onClick={() => onClick(category)}
      className="cursor-pointer border-b last:border-b-0 hover:bg-muted/40"
    >
      <td className="px-2 py-2.5 align-middle">
        <div className="flex flex-col">
          <span className="text-sm font-medium">{category.name}</span>
          <span className="text-xs text-muted-foreground">{categoryTitle(category.type)}</span>
        </div>
      </td>
      {state === BudgetView.Current && (
        <td className="px-2 py-2.5 align-middle">
          <PeriodTooltip recurrence={category.recurrence.type} dates={activePeriod!.dates} under />
        </td>
      )}
      <td className="px-2 py-2.5 align-middle">
        <SpendingBar actual={actual} nominal={nominal} remaining warn={category.type !== CategoryType.Income} />
      </td>
    </tr>
  );
};

type CategoryListProps = {
  budget: Budget;
  onCategoryClicked: (category: Category) => void;
};

export const CategoryList = ({ budget, onCategoryClicked }: CategoryListProps) => {
  const active = budgetStatus(budget) === BudgetStatus.Active;
  const [state, setState] = useState(active ? BudgetView.Current : BudgetView.Total);

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
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-xs text-muted-foreground">
          <th className="min-w-[100px] px-2 py-2 font-medium sm:min-w-[200px]">Name</th>
          {state === BudgetView.Current && (
            <th className="min-w-[100px] px-2 py-2 font-medium sm:min-w-[200px]">Period</th>
          )}
          <th className="w-full px-2 py-2 font-medium">
            <div className="flex items-center justify-between gap-2">
              <span>Progress</span>
              {active && <BudgetViewSelector value={state} onChange={setState} />}
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {budget.categories.map((category) => (
          <CategoryRow key={category.id} state={state} category={category} onClick={onCategoryClicked} />
        ))}
        <tr className="cursor-pointer hover:bg-muted/40" onClick={onAddCategory}>
          <td colSpan={3} className="py-3 text-center">
            <Plus className="mx-auto size-4 text-muted-foreground/50" />
          </td>
        </tr>
      </tbody>
    </table>
  );
};
