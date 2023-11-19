import { HttpError } from "../errors";
import { route, routes } from "../route";
import { supabase } from "../supabase";

const router = routes();

router.delete(route({
  async handler(req, res) {
    const { error } = await supabase.auth.admin.deleteUser(req.user.id);
    if (error) throw new HttpError(error.status ?? 500, error.message);
  }
}));

export default router.handler();