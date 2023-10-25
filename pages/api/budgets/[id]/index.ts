import { budgets } from "src/__mock__/budget";
import { route, routes } from "../../route";
import { NotFound } from "../../errors";
import { z } from "zod";

const router = routes();

router.get(route({
  querySchema: z.object({
    id: z.string()
  }),
  handler(req, res) {
    const budget = budgets.find(b => b.id === req.query.id);
    if (!budget) throw new NotFound("No such budget exists");
    res.json(budget);
  }
}));

router.delete(route({
  querySchema: z.object({
    id: z.string()
  }),
  handler(req, res) {
    const budgetIndex = budgets.findIndex(b => b.id === req.query.id);
    if (budgetIndex >= 0) budgets.splice(budgetIndex, 1);
    res.status(200).end();
  }
}))

export default router.handler();