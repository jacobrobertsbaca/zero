import { produce } from "immer";
import { NotFound } from "pages/api/errors";
import { route, routes } from "pages/api/route";
import { budgets } from "src/__mock__/budget";
import { z } from "zod";

const router = routes();

router.delete(route({
  querySchema: z.object({
    id: z.string(),
    category: z.string()
  }),
  handler(req, res) {
    for (let budgetIndex = 0; budgetIndex < budgets.length; budgetIndex++) {
      const budget = budgets[budgetIndex];
      if (budget.id !== req.query.id) continue;
      for (let categoryIndex = 0; categoryIndex < budget.categories.length; categoryIndex++) {
        const category = budget.categories[categoryIndex];
        if (category.id !== req.query.category) continue;

        budgets[budgetIndex] = produce(budgets[budgetIndex], (draft) => {
          draft.categories.splice(categoryIndex, 1);
        });
        
        break;
      }

      res.status(200).end();
      return;
    }
    throw new NotFound("No such budget exists");
  }
}))

export default router.handler();