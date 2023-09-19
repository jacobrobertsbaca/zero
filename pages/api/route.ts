import { NextApiRequest, NextApiResponse } from "next";
import { RequestHandler } from "next-connect/dist/types/node";
import { createRouter } from "next-connect";
import { supabase } from "./supabase";
import * as Yup from "yup";

type User = {
  id: string;
  token: string;
};

type Request<TBody> = Omit<NextApiRequest, "body"> & {
  body: TBody
};

type AuthorizedRequest<TBody> = Request<TBody> & {
  user: User
};

type RouteOptions<T> = { schema: Yup.Schema<T> } & ({
  protect: false;
  handler: RequestHandler<Request<T>, NextApiResponse>;
} | {
  protect?: true;
  handler: RequestHandler<AuthorizedRequest<T>, NextApiResponse>;
});

const getUser = async (token?: string): Promise<User | null> => {
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    console.log(error);
    return null;
  }
  return {
    token,
    id: data.user.id
  };
};

const validateRequest = async <T>(
  options: RouteOptions<T>, 
  req: NextApiRequest, 
  res: NextApiResponse
): Promise<Request<T> | null> => {
  try {
    const body = await options.schema.validate(req.body, {
      stripUnknown: true
    });
    req.body = body;
    return req;
  } catch (err: any) {
    res.status(400).end(err.message);
    return null;
  }
};

export const routes = () => createRouter<NextApiRequest, NextApiResponse>();

export const route = <T>(options: RouteOptions<T>): RequestHandler<NextApiRequest, NextApiResponse> => {
  return async (req, res) => {
    if (options.protect === false) {
      const request = await validateRequest(options, req, res);
      if (!request) return;
      options.handler(request, res);
    } else {
      /* Protected route */
      const user = await getUser(req.headers.authorization);
      if (!user) return void res.status(401).end("You are not authorized");
      const request = await validateRequest(options, req, res) as AuthorizedRequest<T>;
      if (!request) return;
      request.user = user;
      options.handler(request, res);      
    }
  };
};