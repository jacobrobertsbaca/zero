import { z } from "zod";
import { route, routes } from "../route";
import { transactions } from "src/__mock__/transaction";

const router = routes();

router.delete(route({
  querySchema: z.object({
    id: z.string()
  }),
  handler(req, res) {
    const trxIndex = transactions.findIndex(t => t.id === req.query.id);
    if (trxIndex >= 0) transactions.splice(trxIndex, 1);
    res.status(200).end();
  }
}));

export default router.handler();
