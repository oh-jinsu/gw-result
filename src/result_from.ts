import { err, ok, type Result } from "./result";

export function resultFrom<TParams extends any[], R>(
  Fn: (...args: TParams) => Promise<R>,
  ...args: TParams
): Promise<Result<R>>;

export function resultFrom<TParams extends any[], R>(
  Fn: (...args: TParams) => R,
  ...args: TParams
): Result<R>;

export function resultFrom(fn: any, ...args: any[]): any {
  try {
    const result = fn(...args);

    if (result instanceof Promise) {
      const promise = result.then((res) => ok(res)).catch((e) => err(e));

      return promise as any;
    }

    return ok(result) as any;
  } catch (e) {
    return err(e) as any;
  }
}
