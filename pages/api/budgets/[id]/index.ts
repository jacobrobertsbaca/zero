import { budgets } from "src/__mock__/budget";
import { route, routes } from "../../route";
import { NotFound } from "../../errors";
import { z } from "zod";
import { getBudgets } from "pages/api/common";

const router = routes();

router.get(route({
  querySchema: z.object({
    id: z.string()
  }),
  async handler(req, res) {
    const budgets = await getBudgets(req.user.id, req.query.id);
    if (budgets.length === 0) throw new NotFound("No such budget exists");
    res.json(budgets[0]);
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