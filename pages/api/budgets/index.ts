import { budgets } from "src/__mock__/budget";
import { route, routes } from "../route";
import { z } from "zod";
import { BudgetSchema } from "src/types/budget/schema";
import { Draft, produce } from "immer";
import { Budget } from "src/types/budget/types";
import { budgetCompare, budgetMaxDays, budgetMaxYears } from "src/types/budget/methods";
import { NotFound } from "../errors";
import { isEqual } from "lodash";
import { categoryNominal, onCategoryNominal, onRecurrence } from "src/types/category/methods";
import { Category } from "src/types/category/types";
import { datesDays } from "src/types/utils/methods";
import { supabase } from "../supabase";

const router = routes();

router.get(
  route({
    handler(req, res) {
      res.json(budgets);
    },
  })
);

router.put(
  route({
    bodySchema: z.object({
      budget: BudgetSchema.omit({ categories: true }).refine(
        (value) => datesDays(value.dates) <= budgetMaxDays(),
        `Budget duration cannot exceed ${budgetMaxYears()} years`
      ),
    }),
    handler(req, res) {
      if (!req.body.budget.id) {
        /* Creating a new budget with no categories */
        const newBudget = produce(req.body.budget, (draft: Draft<Budget>) => {
          draft.id = crypto.randomUUID();
          draft.categories = [];
        }) as Budget;

        budgets.push(newBudget);
        budgets.sort(budgetCompare);
        res.status(201).json(newBudget);
        return;
      }

      for (let budgetIndex = 0; budgetIndex < budgets.length; budgetIndex++) {
        const budget = budgets[budgetIndex];
        if (budget.id !== req.body.budget.id) continue;

        /* Need to update name, date, and preserve category totals */
        budgets[budgetIndex] = produce(budget, (draft) => {
          draft.name = req.body.budget.name;
          draft.dates = req.body.budget.dates;

          if (!isEqual(budget.dates, req.body.budget.dates)) {
            for (let i = 0; i < draft.categories.length; i++) {
              /* Reset category periods so that they get updated by onRecurrence */
              const category = draft.categories[i];
              category.periods = [];

              /* Preserve total category amount */
              const total = categoryNominal(budget.categories[i]);
              draft.categories[i] = onRecurrence(draft, draft.categories[i], category.recurrence) as Draft<Category>;
              draft.categories[i] = onCategoryNominal(draft.categories[i], total) as Draft<Category>;
            }
          }
        });

        const result = budgets[budgetIndex];
        budgets.sort(budgetCompare);
        res.status(200).json(result);
        return;
      }

      throw new NotFound("No such budget exists");
    },
  })
);

export default router.handler();
