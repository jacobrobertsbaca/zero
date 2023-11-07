import { transactions } from "src/__mock__/transaction";
import { route, routes } from "../route";
import { z } from "zod";
import { TransactionSchema } from "src/types/transaction/schema";
import { produce } from "immer";
import { transactionCompare } from "src/types/transaction/methods";
import { NotFound } from "../errors";
import { putTransaction } from "../common";

const router = routes();

router.get(
  route({
    handler(req, res) {
      res.json(transactions);
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
