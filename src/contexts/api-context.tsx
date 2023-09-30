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
 * Cache Implementations                                                                                             *
 * ================================================================================================================= */

class Cache<T> {
  private cache: { [id: string]: T} | undefined = undefined;

  /**
   * Invalidates the cache.
   * @param id If specified, invalidates only the given id, not the entire cache.
   */
  invalidate(id?: string): void {
    if (!this.cache) return;
    if (id) delete this.cache[id];
    else this.cache = undefined;
  }

  /**
   * Adds an item to the cache.
   * @param id The id of the item.
   * @param value The value of the item
   */
  add(id: string, value: T): void {
    if (!this.cache) this.cache = {};
    this.cache[id] = value;
  }

  /**
   * Checks if an item is in the cache.
   * @param id The id of the item to check. If undefined, checks if the cache itself has any items.
   */
  has(id?: string): id is undefined {
    if (!this.cache) return false;
    if (id) return id in this.cache;
    return true;
  }

  /**
   * Gets an item by id from the cache, or undefined it doesn't exist.
   * @param id The id of the item to retrieve
   */
  get(id: string): T | undefined {
    if (!this.cache) return undefined;
    return this.cache[id];
  }
  
  /**
   * Gets all items in the cache.
   */
  getAll() : T[] {
    if (!this.cache) return [];
    return Object.values(this.cache);
  }
};

const budgetCache = new Cache<Budget>();

/* ================================================================================================================= *
 * Context Implementation                                                                                            *
 * ================================================================================================================= */

export const ApiContext = createContext<ApiContextType>({} as ApiContextType);

type ApiProviderProps = {
  children: React.ReactNode;
}

export const ApiProvider = ({ children }: ApiProviderProps) => {
  const { user } = useAuth();
  const token = user?.token;

  const api: ApiContextType = {
    async getBudgets() {
      if (budgetCache.has()) return budgetCache.getAll();
      const budgets: Budget[] = await httpGet("/budgets", { token });
      for (const budget of budgets)
        budgetCache.add(budget.id, budget);
      return budgets;
    }
  };

  return <ApiContext.Provider value={api}>
    {children}
  </ApiContext.Provider>
};