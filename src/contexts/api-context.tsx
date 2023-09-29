import { Immutable, produce } from "immer";
import { useSnackbar } from "notistack";
import { Dispatch, createContext } from "react";
import { useAuth } from "src/hooks/use-auth";
import { Budget } from "src/types/budget/types";

export type ApiContextType = Immutable<{
  getBudgets(): Promise<readonly Budget[]>;
}>;

/* ================================================================================================================= *
 * HTTP Helpers                                                                                                      *
 * ================================================================================================================= */

type HTTPOptions = Immutable<{
  token?: string;
  headers?: Record<string, string>;
  data?: any
}>;

type HTTPGetOptions = Immutable<Omit<HTTPOptions, "data"> & {
  data?: Record<string, boolean | number | string>
}>;

const http = async <T,>(path: string, method: string, options: HTTPOptions = {}): Promise<T> => {
  const { token, headers = {}, data } = options;
  const url = `/api${path}`;
  const response = await fetch(url, {
    method: method,
    headers: produce(headers, (draft) => {
      draft["Content-Type"] = "application/json";
      if (token) draft["Authorization"] = token;
    }),
    body: data !== undefined ? JSON.stringify(data) : undefined
  });
  
  if (response.status != 200) throw new Error(await response.text());
  return await response.json();
};

const httpPut     = <T,>(path: string, options: HTTPOptions = {}) => http<T>(path, "PUT", options);
const httpPost    = <T,>(path: string, options: HTTPOptions = {}) => http<T>(path, "POST", options);
const httpDelete  = <T,>(path: string, options: HTTPOptions = {}) => http<T>(path, "DELETE", options);
const httpGet     = <T,>(path: string, options: HTTPGetOptions = {}) => {
  /* GET requests do not allow passing a body, so we must move all data for the request
   * into the query params instead. */
  if (options.data) {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(options.data))
      params.append(key, val.toString());
    path += path.includes("?") ? "&" : "?";
    path += params.toString();
  }

  options = produce(options, draft => { draft.data = undefined; });
  return http<T>(path, "GET", options);
}

/* ================================================================================================================= *
 * Context Implementation                                                                                            *
 * ================================================================================================================= */

export const ApiContext = createContext<ApiContextType>({} as ApiContextType);

type ApiProviderProps = {
  children: React.ReactNode;
}

export const ApiProvider = ({ children }: ApiProviderProps) => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const token = user?.token;

  const api: ApiContextType = {
    async getBudgets() {
      return await httpGet("/budgets", { token });
    }
  };

  return <ApiContext.Provider value={api}>
    {children}
  </ApiContext.Provider>
};