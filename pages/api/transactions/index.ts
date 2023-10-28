import { transactions } from "src/__mock__/transaction";
import { route, routes } from "../route";

const router = routes();

router.get(
  route({
    handler(req, res) {
      res.json(transactions);
    },
  })
);

export default router.handler();
