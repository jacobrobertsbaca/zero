import { route, routes } from "src/server/route";
import { z } from "zod";
import { BudgetSchema } from "src/types/budget/schema";
import { budgetMaxDays, budgetMaxYears } from "src/types/budget/methods";
import { datesDays } from "src/types/utils/methods";
import { getBudgets, putBudget } from "src/server/common";

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
