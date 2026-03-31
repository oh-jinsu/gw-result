import { err, ok, type Result } from "./result";

type ReturnResult<Fn extends (...args: any[]) => any> =
  ReturnType<Fn> extends Promise<infer R>
    ? Promise<Result<R, Error>>
    : Result<ReturnType<Fn>, Error>;

export function resultFrom<
  Fn extends (...args: any[]) => any,
  TParams extends Parameters<Fn>,
>(Fn: Fn, ...args: TParams): ReturnResult<Fn> {
  try {
    const result = Fn(...args);

    if (result instanceof Promise) {
      const promise = result.then((res) => ok(res)).catch((e) => err(e));

      return promise as any;
    }

    return ok(result) as any;
  } catch (e) {
    return err(e) as any;
  }
}
