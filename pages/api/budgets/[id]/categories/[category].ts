import { deleteCategory } from "pages/api/common";
import { route, routes } from "pages/api/route";
import { z } from "zod";

const router = routes();

router.delete(route({
  querySchema: z.object({
    id: z.string(),
    category: z.string()
  }),
  async handler(req, res) {
    await deleteCategory(req.user.id, req.query.id, req.query.category);
    res.status(200).end();
  }
}))

export default router.handler();