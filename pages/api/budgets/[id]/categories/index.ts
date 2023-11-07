import { NotFound } from "pages/api/errors";
import { route, routes } from "pages/api/route";
import { budgets } from "src/__mock__/budget";
import { CategorySchema } from "src/types/category/schema";
import { z } from "zod";
import { produce } from "immer";
import { putCategory } from "pages/api/common";

const router = routes();

router.put(route({
  bodySchema: z.object({
    category: CategorySchema
  }),
  querySchema: z.object({
    id: z.string()
  }),
  async handler(req, res) {
    res.json(await putCategory(req.user.id, req.query.id, req.body.category));
  }
}));

export default router.handler();