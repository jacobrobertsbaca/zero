import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { getBudgets } from "./routes/budget";

const router = createRouter<NextApiRequest, NextApiResponse>();
const apiRouter = createRouter<NextApiRequest, NextApiResponse>();

/* Budgets */
apiRouter.get("/budgets", getBudgets);

router.use("/api", apiRouter);
export default router.handler({
  onError: (err: any, req, res) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).end(err.message);
  }
});