import { useSnackbar } from "notistack";
import { useContext, useState } from "react";
import { ApiContext, ApiContextType } from "src/contexts/api-context";
import useAsyncEffect from "use-async-effect";

/* ================================================================================================================= *
 * API Hook Utilities                                                                                                *
 * ================================================================================================================= */

type ApiSelector<TArgs extends any[], TResult> = (api: ApiContextType) => (...args: TArgs) => TResult | Promise<TResult>; 
type ApiHook<TName extends string, TArgs extends any[], TResult> = (...args: TArgs) => ApiResult<TName, TResult>;
type ApiResult<TName extends string, TResult> = { loading: boolean; } & { [N in TName]?: TResult };

const createApiHook =
  <TName extends string, TArgs extends any[], TResult>(
    selector: ApiSelector<TArgs, TResult>,
    transformer: (result?: TResult) => { [N in TName]?: TResult }
  ): ApiHook<TName, TArgs, TResult> =>
  (...args: TArgs) => {
    const api = useApi();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<TResult | undefined>(undefined);
    const { enqueueSnackbar } = useSnackbar();
    const request = selector(api);

    useAsyncEffect(async () => {
      try {
        setResult(await request(...args));
      } catch (err: any) {
        enqueueSnackbar(err.message, { variant: "error" });
      }
      setLoading(false);
    }, [...args]);

    return { loading, ...transformer(result) };
  };

/* ================================================================================================================= *
 * API Hooks                                                                                                         *
 * ================================================================================================================= */

export const useApi = () => useContext(ApiContext);
export const useBudgets = createApiHook(api => api.getBudgets, result => ({ budgets: result}));