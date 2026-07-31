import { HttpError } from "src/server/errors";
import { route, routes } from "src/server/route";
import { supabase } from "src/server/supabase";

const router = routes();

router.delete(route({
  async handler(req, res) {
    const { error } = await supabase.auth.admin.deleteUser(req.user.id);
    if (error) throw new HttpError(error.status ?? 500, error.message);
    res.status(204).end();
  }
}));

export default router.handler();