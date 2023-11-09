import { z } from "zod";
import { route, routes } from "../route";
import { deleteTransaction } from "../common";

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
