import { budgets } from "src/__mock__/budget";
import { route, routes } from "../route";
import * as Yup from "yup";

const router = routes();

router.get(route({
  handler(req, res) {
    res.json(budgets);
  },
}));

export default router.handler();