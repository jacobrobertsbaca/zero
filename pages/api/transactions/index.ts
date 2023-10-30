import { transactions } from "src/__mock__/transaction";
import { route, routes } from "../route";
import { z } from "zod";
import { TransactionSchema } from "src/types/transaction/schema";
import { produce } from "immer";
import { transactionCompare } from "src/types/transaction/methods";
import { NotFound } from "../errors";

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
    handler(req, res) {
      if (!req.body.transaction.id) {
        const trx = produce(req.body.transaction, (draft) => {
          trx.id = crypto.randomUUID();
        });
        transactions.push(trx);
        transactions.sort(transactionCompare);
        return res.status(201).json(trx);
      }

      for (let i = 0; i < transactions.length; i++) {
        const trx = transactions[i];
        if (trx.id !== req.body.transaction.id) continue;
        transactions[i] = trx;
        transactions.sort(transactionCompare);
        return res.status(200).json(trx);
      }

      throw new NotFound("No such transaction exists");
    },
  })
);

export default router.handler();
