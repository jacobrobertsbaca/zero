import { useSnackbar } from "notistack";
import { useCallback, useContext, useState } from "react";
import { ApiContext, ApiContextType } from "src/contexts/api-context";
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
    const { enqueueSnackbar } = useSnackbar();
    const request = selector(api);

    const [refreshCounter, setRefreshCounter] = useState(0);
    const refresh = useCallback(() => {
      setLoading(true);
      setRefreshCounter(refreshCounter + 1);
    }, [refreshCounter]);

    useAsyncEffect(async () => {
      try {
        setResult(await request(...args));
      } catch (err: any) {
        console.log(err);
        enqueueSnackbar(err.message, { variant: "error" });
      }
      setLoading(false);
    }, [...args, refreshCounter]);

    return { loading, result, refresh };
  };

/* ================================================================================================================= *
 * API Hooks                                                                                                         *
 * ================================================================================================================= */

export const useApi = () => useContext(ApiContext);
export const useBudgets = createApiHook(api => api.getBudgets);
export const useBudget = createApiHook(api => api.getBudget);