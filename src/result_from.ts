import { err, ok, type Result } from "./result";

/**
 * Returns true when a value behaves like a promise.
 */
function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

/**
 * Runs an async or promise-like function and converts rejection into `Err`.
 *
 * Caught errors are typed as `unknown` by default. Pass `TError` when you know
 * the error shape at a boundary.
 */
export function resultFrom<
  R,
  TError = unknown,
  TParams extends any[] = any[],
>(
  Fn: (...args: TParams) => PromiseLike<R>,
  ...args: TParams
): Promise<Result<R, TError>>;

/**
 * Runs a synchronous function and converts thrown values into `Err`.
 *
 * Caught errors are typed as `unknown` by default. Pass `TError` when you know
 * the error shape at a boundary.
 */
export function resultFrom<
  R,
  TError = unknown,
  TParams extends any[] = any[],
>(
  Fn: (...args: TParams) => R,
  ...args: TParams
): Result<R, TError>;

export function resultFrom(fn: any, ...args: any[]) {
  try {
    const result = fn(...args);

    if (isPromiseLike(result)) {
      return Promise.resolve(result)
        .then((res) => ok(res))
        .catch((e) => err(e));
    }

    return ok(result);
  } catch (e) {
    return err(e);
  }
}
