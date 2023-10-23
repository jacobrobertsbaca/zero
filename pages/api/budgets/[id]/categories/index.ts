import { NotFound } from "pages/api/errors";
import { route, routes } from "pages/api/route";
import { budgets } from "src/__mock__/budget";
import { CategorySchema } from "src/types/category/schema";
import { z } from "zod";
import { produce } from "immer";

const router = routes();

router.put(route({
  bodySchema: z.object({
    category: CategorySchema
  }),
  querySchema: z.object({
    id: z.string()
  }),
  handler(req, res) {
    for (let budgetIndex = 0; budgetIndex < budgets.length; budgetIndex++) {
      const budget = budgets[budgetIndex];
      if (budget.id !== req.query.id) continue;
      for (let categoryIndex = 0; categoryIndex < budget.categories.length; categoryIndex++) {
        const category = budget.categories[categoryIndex];
        if (category.id !== req.body.category.id) continue;

        budgets[budgetIndex] = produce(budgets[budgetIndex], (draft) => {
          draft.categories[categoryIndex] = req.body.category;
        });
        
        res.json(req.body.category);
        return;
      }

      throw new NotFound(`No such category exists in budget '${budget.id}'`);
    }
    throw new NotFound("No such budget exists");
  }
}));

router.post(route({
  bodySchema: z.object({
    category: CategorySchema
  }),
  querySchema: z.object({
    id: z.string()
  }),
  handler(req, res) {
    req.body.category = produce(req.body.category, (draft) => {
      draft.id = crypto.randomUUID();
    });

    for (let budgetIndex = 0; budgetIndex < budgets.length; budgetIndex++) {
      const budget = budgets[budgetIndex];
      if (budget.id !== req.query.id) continue;
      budgets[budgetIndex] = produce(budgets[budgetIndex], (draft) => {
        draft.categories.push(req.body.category);
      });
      res.json(req.body.category);
      return;
    }

    throw new NotFound("No such budget exists");
  }
}));

export default router.handler();