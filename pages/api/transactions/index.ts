import { route, routes } from "../route";
import { z } from "zod";
import { TransactionSchema } from "src/types/transaction/schema";
import { getTransactions, putTransaction } from "../common";

const router = routes();

router.get(
  route({
    async handler(req, res) {
      res.json(await getTransactions(req.user.id));
    },
  })
);

router.put(
  route({
    bodySchema: z.object({
      transaction: TransactionSchema,
    }),
    async handler(req, res) {
      res.json(await putTransaction(req.user.id, req.body.transaction));
    },
  })
);

export default router.handler();
