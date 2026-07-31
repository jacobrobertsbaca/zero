import { z } from "zod";
import { route, routes } from "src/server/route";
import { deleteTransaction } from "src/server/common";

const router = routes();

router.delete(route({
  querySchema: z.object({
    id: z.string()
  }),
  async handler(req, res) {
    await deleteTransaction(req.user.id, req.query.id);
    res.status(200).end();
  }
}));

export default router.handler();
