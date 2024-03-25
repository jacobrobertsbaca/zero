import { Immutable, produce } from "immer";

export type HTTPOptions = Immutable<{
  token?: string;
  headers?: Record<string, string>;
  data?: any;
}>;

export const http = async <T>(
  path: string,
  method: "GET" | "PUT" | "POST" | "DELETE" | "PATCH",
  options: HTTPOptions = {}
): Promise<T> => {
  const { token, headers = {}, data } = options;
  const url = `/api${path}`;
  const response = await fetch(url, {
    method,
    headers: produce(headers, (draft) => {
      draft["Content-Type"] = "application/json";
      if (token) draft["Authorization"] = token;
    }),
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) throw new Error(await response.text());
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") >= 0) return await response.json();
  return (await response.text()) as T;
};
