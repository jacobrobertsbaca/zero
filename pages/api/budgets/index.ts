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
import { getBudgets, putBudget } from "../common";

const router = routes();

router.get(
  route({
    async handler(req, res) {
      res.json(await getBudgets(req.user.id));
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
    async handler(req, res) {
      res.json(await putBudget(req.user.id, req.body.budget));
    }
  })
);

export default router.handler();
