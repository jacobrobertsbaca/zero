import { Draft, Immutable, produce } from "immer";
import { createContext } from "react";
import { useAuth } from "src/hooks/use-auth";
import { budgetCompare } from "src/types/budget/methods";
import { Budget } from "src/types/budget/types";
import { Category } from "src/types/category/types";
import { moneySub, moneySum } from "src/types/money/methods";
import { transactionCompare } from "src/types/transaction/methods";
import { Transaction } from "src/types/transaction/types";
import { datesContains } from "src/types/utils/methods";

export type ApiContextType = Immutable<{
  getBudgets(): Promise<readonly Budget[]>;
  getBudget(id: string): Promise<Budget>;
  putBudget(budget: Budget): Promise<Budget>;
  deleteBudget(budget: Budget): Promise<void>;
  putCategory(budgetID: string, category: Category): Promise<Category>;
  deleteCategory(budgetID: string, categoryID: string): Promise<void>;
  getTransactions(): Promise<readonly Transaction[]>;
  putTransaction(trx: Transaction): Promise<Transaction>;
  starTransaction(trx: Transaction, starred: boolean, onFailure: (error: any) => void): void;
  deleteTransaction(trx: Transaction): Promise<void>;
  deleteAccount(): Promise<void>;
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
  
  if (!response.ok) throw new Error(await response.text());
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") >= 0)
    return await response.json();
  return await response.text() as T;
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
  const { user, signOut } = useAuth();
  const token = user?.token;

  const api: ApiContextType = {
    async getBudgets() {
      return await httpGet("/budgets", { token });
    },

    async getBudget(id) {
      return await httpGet(`/budgets/${id}`, { token });
    },

    async putBudget(budget) {
      return await httpPut(`/budgets`, { token, data: { budget }});
    },

    async deleteBudget(budget) {
      await httpDelete(`/budgets/${budget.id}`, { token });
    },

    async putCategory(budgetID, category) {
      return await httpPut(`/budgets/${budgetID}/categories`, { token, data: { category }});
    },

    async deleteCategory(budgetID, categoryID) {
      await httpDelete(`/budgets/${budgetID}/categories/${categoryID}`, { token });
    },

    async getTransactions() {
      return await httpGet("/transactions", { token });
    },

    async putTransaction(trx) {
      return await httpPut("/transactions", { token, data: { transaction: trx }});
    },

    starTransaction(trx, starred, onFailure) {
      const newTrx = produce(trx, (draft) => {
        draft.starred = starred;
        draft.lastModified = new Date().toISOString();
      });

      /* Asynchronously star transaction on backend, report error if it fails */
      (async () => {
        try {
          await api.putTransaction(newTrx);
        } catch (err) {
          onFailure(err);
        }
      })();
    },

    async deleteTransaction(trx) {
      await httpDelete(`/transactions/${trx.id}`, { token });
    },

    async deleteAccount() {
      await httpDelete(`/account`, { token });
      await signOut();
    },
  };

  return <ApiContext.Provider value={api}>
    {children}
  </ApiContext.Provider>
};