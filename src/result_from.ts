import { err, ok, type Result } from "./result";

export function resultFrom<TParams extends any[], R>(
  Fn: (...args: TParams) => Promise<R>,
  ...args: TParams
): Promise<Result<R>>;

export function resultFrom<TParams extends any[], R>(
  Fn: (...args: TParams) => R,
  ...args: TParams
): Result<R>;

export function resultFrom(fn: any, ...args: any[]) {
  try {
    const result = fn(...args);

    if (result instanceof Promise) {
      const promise = result.then((res) => ok(res)).catch((e) => err(e));

      return promise;
    }

    return ok(result);
  } catch (e) {
    return err(e);
  }
}
