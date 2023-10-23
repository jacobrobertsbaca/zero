import { budgets } from "src/__mock__/budget";
import { route, routes } from "../route";
import { NotFound } from "../errors";
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

export default router.handler();