import { enqueueSnackbar } from "notistack";

const onError = (err: any) => {
  console.log(err);
  enqueueSnackbar(err.message, { variant: "error" });
};

/**
 * Executes a function and toasts any error that occurs.
 * @param func The function to run, which can return a value of type {@link T}
 * @param onFail A function which is run when an error occurs, returning a value of type {@link F}
 * @returns A value of type {@link T} or {@link F} depending on whether an error occured.
 */
export const wrap = <T, F = undefined>(func: () => T, onFail?: (err: any) => F): T | F => {
  try {
    return func();
  } catch (err: any) {
    onError(err);
    return onFail?.(err) as F;
  }
};

/**
 * Executes an asynchronous function and toasts any error that occurs.
 * @param func The async function to run, which can return a value of type {@link T}
 * @param onFail A function which is run when an error occurs, returning a value of type {@link F}
 * @returns A value of type {@link T} or {@link F} depending on whether an error occured.
 */
export const wrapAsync = async <T, F = undefined>(func: () => Promise<T>, onFail?: (err: any) => F): Promise<T | F> => {
  try {
    return await func();
  } catch (err: any) {
    onError(err);
    return onFail?.(err) as F;
  }
};
