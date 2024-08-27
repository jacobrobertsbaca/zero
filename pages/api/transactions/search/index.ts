import { route, routes } from "../../route";
import { z } from "zod";
import { TransactionQuerySchema, TransactionSchema } from "src/types/transaction/schema";
import { searchTransactions } from "../../common";

const router = routes();

const bodySchema = z.object({
  model: TransactionQuerySchema,
  cursor: TransactionSchema.optional(),
  limit: z.number().min(10).max(100).default(50),
});

router.post(
  route({
    bodySchema,
    async handler(req, res) {
      res.json(await searchTransactions(req.user.id, req.body.model, req.body.cursor, req.body.limit));
    },
  })
);

export default router.handler();
