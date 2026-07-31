import { route, routes } from "src/server/route";
import { NotFound } from "src/server/errors";
import { z } from "zod";
import { deleteBudget, getBudgets } from "src/server/common";

const router = routes();

router.get(route({
  querySchema: z.object({
    id: z.string()
  }),
  async handler(req, res) {
    const budgets = await getBudgets(req.user.id, req.query.id);
    if (budgets.length === 0) throw new NotFound("No such budget exists!");
    res.json(budgets[0]);
  }
}));

router.delete(route({
  querySchema: z.object({
    id: z.string()
  }),
  async handler(req, res) {
    await deleteBudget(req.user.id, req.query.id);
    res.status(200).end();
  }
}))

export default router.handler();