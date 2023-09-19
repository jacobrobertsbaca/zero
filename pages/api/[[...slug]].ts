import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import budgetRoutes from "./routes/budget";
import { routes } from "./route";

const api = routes();

api.use("/budgets", budgetRoutes);

const router = routes();
router.use("/api", api);
export default router.handler({
  onError: (err: any, req, res) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).end(err.message);
  }
});