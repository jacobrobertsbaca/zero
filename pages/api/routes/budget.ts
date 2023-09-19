import { budgets } from "src/__mock__/budget";
import { routes, route } from "../route";
import * as Yup from "yup";

const router = routes();

router.get("/", route({
  schema: Yup.object({}),
  handler(req, res) {
    res.json(budgets);
  }
}));

export default router;