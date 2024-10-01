import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "./supabase";
import { HttpError, Unauthorized } from "./errors";
import { createRouter } from "next-connect";
import { RequestHandler } from "next-connect/dist/types/node";
import { z } from "zod";

type User = {
  /**
   * A unique identifier for this user
   */
  id: string;

  /**
   * The JWT used to authenticate this user.
   */
  token: string;
};

type Request<TBody, TQuery> = Omit<NextApiRequest, "body" | "query"> & {
  body: TBody;
  query: TQuery;
};

type AuthorizedRequest<TBody, TQuery> = Request<TBody, TQuery> & {
  /**
   * The user making this request.
   */
  user: User
};

type RouteOptions<TBody, TQuery> = {
  /**
   * If defined, specifies the schema which the request body must conform to.
   * If the body does not conform, then a 400 is returned.
   * If undefined, the body is not validated.
   */
  bodySchema?: z.ZodType<TBody, any, any>;

  /**
   * If defined, specifies the schema which the query parameters must conform to.
   * If the query parameters do not conform, then a 400 is returned.
   * If undefined, the query parameters are not validated.
   */
  querySchema?: z.ZodType<TQuery, any, any>;
} & ({
  protect: false;
  handler: RequestHandler<Request<TBody, TQuery>, NextApiResponse>;
} | {
  protect?: true;
  handler: RequestHandler<AuthorizedRequest<TBody, TQuery>, NextApiResponse>;
});

const validate = async <T extends z.ZodTypeAny>(o: any, schema: T): Promise<z.infer<T>> => {
  try {
    return await schema.parseAsync(o);
  } catch (err) {
    if (err instanceof z.ZodError)
      throw new HttpError(400, err.toString());
    throw err;
  }
};

const authorize = async <B, Q>(req: Request<B, Q>): Promise<void> => {
  const token = req.headers.authorization;
  if (!token) throw new Unauthorized();
  const { data, error } = await supabase.auth.getUser(token);
  if (error) throw new Unauthorized(error.message);
  const { user } = data;
  (req as AuthorizedRequest<B, Q>).user = {
    token,
    id: user.id
  };
}

const forwardErrors = (
  handler: RequestHandler<NextApiRequest, NextApiResponse>
): RequestHandler<NextApiRequest, NextApiResponse> => {
  return async (req, res) => {
    try { await handler(req, res); }
    catch (err: any) {
      console.log(err);
      res.status(err.statusCode || 500).end(err.message);
    }
  };
}

export const routes = () => createRouter<NextApiRequest, NextApiResponse>();

export const route = <TBody = any, TQuery = any>(
  options: RouteOptions<TBody, TQuery>
): RequestHandler<NextApiRequest, NextApiResponse> => forwardErrors(async (_req, res) => {
  const req = _req as Request<TBody, TQuery>;

  /* Check user authorization as soon as possible if route is protected */
  if (options.protect !== false) await authorize(req);

  /* Set request body and query */
  if (options.bodySchema) req.body = await validate(_req.body, options.bodySchema);
  if (options.querySchema) req.query = await validate(_req.query, options.querySchema);

  await options.handler(req as AuthorizedRequest<TBody, TQuery>, res)
});