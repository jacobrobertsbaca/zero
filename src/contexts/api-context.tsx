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
  deleteTransaction(trx: Transaction): Promise<void>;
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
 * Cache Implementations                                                                                             *
 * ================================================================================================================= */

class Cache<T> {
  private cache: Map<string, T> | undefined = undefined;

  /**
   * Invalidates the cache.
   * @param id If specified, invalidates only the given id, not the entire cache.
   */
  invalidate(id?: string): void {
    if (!this.cache) return;
    if (id) this.cache.delete(id);
    else this.cache = undefined;
  }

  /**
   * Invalidates item in the cache matching a condition.
   * @param pred A predicate to match items on, accepting both the item and its id.
   */
  invalidateWhere(pred: (value: T, id: string) => boolean): void {
    if (!this.cache) return;
    for (const id of [...this.cache.keys()]) {
      if (pred(this.cache.get(id)!, id))
        this.cache.delete(id);
    }
  }

  /**
   * Adds an item to the cache.
   * @param id The id of the item.
   * @param value The value of the item
   */
  add(id: string, value: T): void {
    if (!this.cache) this.cache = new Map();
    this.cache.set(id, value);
  }

  /**
   * Checks if an item is in the cache.
   * @param id The id of the item to check. If undefined, checks if the cache itself has any items.
   */
  has(id?: string): boolean {
    if (!this.cache) return false;
    if (id) return this.cache.has(id);
    return true;
  }

  /**
   * Gets an item by id from the cache, or undefined it doesn't exist.
   * @param id The id of the item to retrieve
   */
  get(id: string): T {
    if (!this.cache) throw Error("No items in cache!");
    if (!this.has(id)) throw Error(`No item in cache with id ${id}`);
    return this.cache.get(id)!;
  }
  
  /**
   * Gets all items in the cache.
   */
  getAll() : T[] {
    if (!this.cache) return [];
    return Array.from(this.cache.values());
  }

  /**
   * Sorts the items in the cache by their values
   */
  sortValues(compareFn?: (a: T, b: T) => number) : void {
    if (!this.cache) return;
    const compare = compareFn ? (a: [string, T], b: [string, T]) => compareFn(a[1], b[1]) : compareFn; 
    this.cache = new Map([...this.cache.entries()].sort(compare));
  }
};

const budgetCache = new Cache<Budget>();
const transactionCache = new Cache<Transaction>();

const placeTransaction = (trx: Transaction, remove: boolean) => {
  if (remove) transactionCache.invalidate(trx.id);
  else transactionCache.add(trx.id, trx);
  if (!budgetCache.has(trx.budget)) return;
  const budget = budgetCache.get(trx.budget);
  const categoryIndex = budget.categories.findIndex(c => c.id === trx.category);
  if (categoryIndex < 0) return;
  const category = budget.categories[categoryIndex];

  for (let periodIndex = 0; periodIndex < category.periods.length; periodIndex++) {
    const period = category.periods[periodIndex];
    if (datesContains(period.dates, trx.date)) {
      const alteredBudget = produce(budget, (draft) => {
        draft.categories[categoryIndex].periods[periodIndex].actual = remove
          ? moneySub(period.actual, trx.amount)
          : moneySum(period.actual, trx.amount);
      });
      budgetCache.add(budget.id, alteredBudget);
      break;
    }
  }
};

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
    },

    async getBudget(id) {
      if (budgetCache.has(id)) return budgetCache.get(id);
      const budget: Budget = await httpGet(`/budgets/${id}`, { token });
      budgetCache.add(budget.id, budget);
      return budget;
    },

    async putBudget(budget) {
      budget = await httpPut(`/budgets`, { token, data: { budget }});
      budgetCache.add(budget.id, budget);
      budgetCache.sortValues(budgetCompare);
      return budget;
    },

    async deleteBudget(budget) {
      await httpDelete(`/budgets/${budget.id}`, { token });
      budgetCache.invalidate(budget.id);
      transactionCache.invalidateWhere((trx) => trx.budget === budget.id);
    },

    async putCategory(budgetID, category) {
      const path = `/budgets/${budgetID}/categories`;
      if (category.id === "") category = await httpPost(path, { token, data: { category }});
      else category = await httpPut(path, { token, data: { category }});
      if (budgetCache.has(budgetID)) {
        budgetCache.add(budgetID, produce(budgetCache.get(budgetID), (draft) => {
          const index = draft.categories.findIndex(c => c.id === category.id);
          if (index >= 0)
            draft.categories[index] = category as Draft<Category>;
          else draft.categories.push(category as Draft<Category>);
        }));
      }
      return category;
    },

    async deleteCategory(budgetID, categoryID) {
      await httpDelete(`/budgets/${budgetID}/categories/${categoryID}`, { token });
      if (budgetCache.has(budgetID)) {
        budgetCache.add(budgetID, produce(budgetCache.get(budgetID), (draft) => {
          const index = draft.categories.findIndex(c => c.id === categoryID);
          if (index >= 0) draft.categories.splice(index, 1);
        }));
      }
      transactionCache.invalidateWhere((trx) => trx.category === categoryID);
    },

    async getTransactions() {
      if (transactionCache.has()) return transactionCache.getAll();
      const transactions: Transaction[] = await httpGet("/transactions", { token });
      for (const trx of transactions)
        transactionCache.add(trx.id, trx);
      return transactions;
    },

    async putTransaction(trx) {
      trx = await httpPut("/transactions", { token, data: { transaction: trx }});
      if (transactionCache.has(trx.id)) placeTransaction(transactionCache.get(trx.id), true);
      placeTransaction(trx, false);
      transactionCache.sortValues(transactionCompare);
      return trx;
    },

    async deleteTransaction(trx) {
      await httpDelete(`/transactions/${trx.id}`, { token });
      placeTransaction(trx, true);
    },
  };

  return <ApiContext.Provider value={api}>
    {children}
  </ApiContext.Provider>
};