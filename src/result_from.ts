import { err, ok, type Result } from "./result";

type AnyFn = (...args: any[]) => any;

type ReturnResult<Fn extends AnyFn> =
  ReturnType<Fn> extends Promise<infer R>
    ? Promise<Result<R>>
    : Result<ReturnType<Fn>>;

export function resultFrom<Fn extends AnyFn, TParams extends Parameters<Fn>>(
  Fn: Fn,
  ...args: TParams
): ReturnResult<Fn> {
  try {
    const result = Fn(...args);

    if (result instanceof Promise) {
      const promise = result.then((res) => ok(res)).catch((e) => err(e));

      return promise as ReturnResult<Fn>;
    }

    return ok(result) as ReturnResult<Fn>;
  } catch (e) {
    return err(e) as ReturnResult<Fn>;
  }
}
