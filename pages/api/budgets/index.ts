import { budgets } from "src/__mock__/budget";
import { route, routes } from "../route";

const router = routes();

router.get(route({
  handler(req, res) {
    res.json(budgets);
  },
}));

export default router.handler();