import { budgets } from "src/__mock__/budget";
import { route, routes } from "../route";
import * as Yup from "yup";
import { NotFound } from "../errors";

const router = routes();

router.get(route({
  querySchema: Yup.object({
    id: Yup.string().required()
  }),
  handler(req, res) {
    const budget = budgets.find(b => b.id === req.query.id);
    if (!budget) throw new NotFound("No such budget exists");
    res.json(budget);
  }
}));

export default router.handler();