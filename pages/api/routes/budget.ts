import { budgets } from "src/__mock__/budget";
import { route } from "../route";
import * as Yup from "yup";

export const getBudgets = route({
  schema: Yup.object({}),
  handler(req, res) {
    res.json(budgets);
  }
});