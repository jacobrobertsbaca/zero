import { useSnackbar } from "notistack";
import { useCallback, useContext, useReducer, useState } from "react";
import { ApiContext, ApiContextType } from "src/contexts/api-context";
import { wrapAsync } from "src/utils/wrap-errors";
import useAsyncEffect from "use-async-effect";

/* ================================================================================================================= *
 * API Hook Utilities                                                                                                *
 * ================================================================================================================= */

type ApiSelector<TArgs extends any[], TResult> = (api: ApiContextType) => (...args: TArgs) => TResult | Promise<TResult>; 
type ApiHook<TArgs extends any[], TResult> = (...args: TArgs) => ApiResult<TResult>;
type ApiResult<TResult> = { loading: boolean; result?: TResult, refresh: () => void };

const createApiHook =
  <TArgs extends any[], TResult>(
    selector: ApiSelector<TArgs, TResult>
  ): ApiHook<TArgs, TResult> =>
  (...args: TArgs) => {
    const api = useApi();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<TResult | undefined>(undefined);
    const request = selector(api);
    const [refreshCounter, refresh] = useReducer((s) => s + 1, 0);

    useAsyncEffect(async () => {
      await wrapAsync(async () => setResult(await request(...args)));
      setLoading(false);
    }, [refreshCounter, ...args]);

    return { loading, result, refresh };
  };

/* ================================================================================================================= *
 * API Hooks                                                                                                         *
 * ================================================================================================================= */

export const useApi = () => useContext(ApiContext);
export const useBudgets = createApiHook(api => api.getBudgets);
export const useBudget = createApiHook(api => api.getBudget);
export const useTransactions = createApiHook(api => api.getTransactions);