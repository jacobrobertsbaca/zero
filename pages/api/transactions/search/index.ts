import { route, routes } from "../../route";
import { z } from "zod";
import { TransactionFilterSchema, TransactionSchema, TransactionSortSchema } from "src/types/transaction/schema";
import { searchTransactions } from "../../common";

const router = routes();

const s = z.object({
  sort: TransactionSortSchema.array()
    .optional()
    .refine((a) => {
      if (!a) return true;
      const columns = a.map((s) => s.column);
      return new Set(columns).size === a.length;
    }, "sort cannot have duplicate columns"),
  filter: TransactionFilterSchema.optional(),
  cursor: TransactionSchema.optional(),
  limit: z.number().min(10).max(100).default(50),
});

router.post(
  route({
    bodySchema: s,
    async handler(req, res) {
      res.json(await searchTransactions(req.user.id, req.body.filter, req.body.sort, req.body.cursor, req.body.limit));
    },
  })
);

export default router.handler();
