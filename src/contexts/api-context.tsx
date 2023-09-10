import { produce } from "immer";
import { createContext } from "react";
import { Budget } from "src/types/budget/types";

type ApiContextType = {
  getBudgets(): Promise<readonly Budget[]>;
};

/* ================================================================================================================= *
 * HTTP Helpers                                                                                                      *
 * ================================================================================================================= */

type HTTPOptions = {
  auth?: string;
  headers?: Record<string, string>;
  body?: any
};

const http = async <T,>(url: string, method: string, options: HTTPOptions = {}): Promise<T> => {
  const { auth, headers = {}, body = {} } = options;
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

const httpGet     = <T,>(url: string, options: HTTPOptions = {}) => http<T>(url, "GET", options);
const httpPut     = <T,>(url: string, options: HTTPOptions = {}) => http<T>(url, "PUT", options);
const httpPost    = <T,>(url: string, options: HTTPOptions = {}) => http<T>(url, "POST", options);
const httpDelete  = <T,>(url: string, options: HTTPOptions = {}) => http<T>(url, "DELETE", options);

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