import {
  err,
  exception,
  exceptionFromResponse,
  fetchWithResult,
  ok,
  resultFrom,
  type Err,
  type Ex,
  type Exception,
  type Ok,
  type Result,
} from "gw-result";

type Equal<TActual, TExpected> =
  (<T>() => T extends TActual ? 1 : 2) extends
  (<T>() => T extends TExpected ? 1 : 2)
    ? true
    : false;

type Expect<T extends true> = T;

const okResult = ok(123);
type OkResultIsTyped = Expect<Equal<typeof okResult, Ok<number>>>;

const voidOkResult = ok();
type VoidOkResultIsTyped = Expect<Equal<typeof voidOkResult, Ok<void>>>;

const errResult = err("INVALID");
type ErrResultIsTyped = Expect<Equal<typeof errResult, Err<"INVALID">>>;

function parsePort(value: string) {
  if (!value) {
    return err("EMPTY");
  }

  const port = Number(value);

  if (!Number.isInteger(port)) {
    return err("INVALID");
  }

  return ok(port);
}

const inferredPortResult = parsePort("3000");

if (inferredPortResult.isErr) {
  const error: "EMPTY" | "INVALID" = inferredPortResult.error;
}

const explicitPortResult: Result<number, "EMPTY" | "INVALID"> =
  parsePort("3000");

// @ts-expect-error Inferred error branches include INVALID too.
const tooNarrowPortResult: Result<number, "EMPTY"> = parsePort("3000");

const result: Result<number, "EMPTY" | "INVALID"> =
  Math.random() > 0.5 ? ok(3000) : err("EMPTY");

if (result.isOk) {
  const value: number = result.value;

  // @ts-expect-error Successful results do not expose an error.
  result.error;
} else {
  const error: "EMPTY" | "INVALID" = result.error;

  // @ts-expect-error Failed results do not expose a value.
  result.value;
}

const resultFromSync = resultFrom((value: string) => Number(value), "42");
type ResultFromSyncIsTyped = Expect<
  Equal<typeof resultFromSync, Result<number>>
>;

const resultFromAsync = resultFrom(async (id: string) => ({ id }), "user_123");
type ResultFromAsyncIsTyped = Expect<
  Equal<typeof resultFromAsync, Promise<Result<{ id: string }>>>
>;

resultFrom((prefix: string, count: number) => prefix.repeat(count), "x", 2);

// @ts-expect-error resultFrom should preserve wrapped function parameters.
resultFrom((prefix: string, count: number) => prefix.repeat(count), "x", "2");

const authResult: Result<string, Exception<"UNAUTHORIZED" | "FORBIDDEN">> =
  Math.random() > 0.5
    ? ok("user_123")
    : exception("UNAUTHORIZED", "Sign in is required.");

if (authResult.isErr) {
  const code: "UNAUTHORIZED" | "FORBIDDEN" = authResult.error.code;
  const message: string = authResult.error.message;

  // @ts-expect-error Exception codes stay narrowed to the declared union.
  const wrongCode: "NOT_FOUND" = authResult.error.code;
}

const validationException = exception(
  "VALIDATION_FAILED",
  "Email is required.",
);
type ExceptionResultIsTyped = Expect<
  Equal<typeof validationException, Ex<"VALIDATION_FAILED">>
>;

const responseException = exceptionFromResponse<"NOT_FOUND">(
  new Response(
    JSON.stringify({
      code: "NOT_FOUND",
      message: "User not found.",
    }),
  ),
);
type ExceptionFromResponseIsTyped = Expect<
  Equal<typeof responseException, Promise<Ex<"NOT_FOUND">>>
>;

const fetchResult = fetchWithResult("/api/users");
type FetchResultIsTyped = Expect<
  Equal<
    typeof fetchResult,
    Promise<Err<Error> | Ok<Response> | Ex<"REQUEST_FAILED">>
  >
>;
