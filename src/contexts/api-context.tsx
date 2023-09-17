import { Immutable, produce } from "immer";
import { createContext } from "react";
import { Budget } from "src/types/budget/types";

type ApiContextType = Immutable<{
  getBudgets(): Promise<readonly Budget[]>;
}>;

/* ================================================================================================================= *
 * HTTP Helpers                                                                                                      *
 * ================================================================================================================= */

type HTTPOptions = {
  auth?: string;
  headers?: Record<string, string>;
  body?: any
};

const http = async <T,>(path: string, method: string, options: HTTPOptions = {}): Promise<T> => {
  const { auth, headers = {}, body = {} } = options;
  const url = `${process.env.NEXT_PUBLIC_API_ENDPOINT}${path}`; 
  const response = await fetch(url, {
    method: method,
    headers: produce(headers, (draft) => {
      headers["Content-Type"] = "application/json";
      if (auth) headers["Authorization"] = `token ${auth}`;
    }),
    body: JSON.stringify(body)
  });
  return response.json();
};

const httpGet     = <T,>(path: string, options: HTTPOptions = {}) => http<T>(path, "GET", options);
const httpPut     = <T,>(path: string, options: HTTPOptions = {}) => http<T>(path, "PUT", options);
const httpPost    = <T,>(path: string, options: HTTPOptions = {}) => http<T>(path, "POST", options);
const httpDelete  = <T,>(path: string, options: HTTPOptions = {}) => http<T>(path, "DELETE", options);

/* ================================================================================================================= *
 * Context Implementation                                                                                            *
 * ================================================================================================================= */

export const ApiContext = createContext<ApiContextType>({} as ApiContextType);

type ApiProviderProps = {
  children: React.ReactNode;
}

export const ApiProvider = ({ children }: ApiProviderProps) => {
  const api: ApiContextType = {
    async getBudgets() {
      return [];
    }
  };

  return <ApiContext.Provider value={api}>
    {children}
  </ApiContext.Provider>
};