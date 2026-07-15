import {
  err,
  exception,
  fetchWithResult,
  HttpException,
  httpException,
  ok,
  resultFrom,
  type Err,
  type Ex,
  type Exception,
  type HttpEx,
  type Ok,
  type Result,
} from "gw-result";

type Equal<TActual, TExpected> =
  (<T>() => T extends TActual ? 1 : 2) extends <T>() => T extends TExpected ? 1 : 2 ? true : false;

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

type ParsePortResultIsInferred = Expect<
  Equal<ReturnType<typeof parsePort>, Ok<number> | Err<"EMPTY"> | Err<"INVALID">>
>;

const inferredPortResult = parsePort("3000");

if (inferredPortResult.isErr) {
  const error: "EMPTY" | "INVALID" = inferredPortResult.error;
}

const result: Result<number, "EMPTY" | "INVALID"> = Math.random() > 0.5 ? ok(3000) : err("EMPTY");

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
type ResultFromSyncIsTyped = Expect<Equal<typeof resultFromSync, Result<number, unknown>>>;

const resultFromAsync = resultFrom(async (id: string) => ({ id }), "user_123");
type ResultFromAsyncIsTyped = Expect<Equal<typeof resultFromAsync, Promise<Result<{ id: string }, unknown>>>>;

const resultFromExplicitError = resultFrom<number, SyntaxError>(() => 42);
type ResultFromExplicitErrorIsTyped = Expect<Equal<typeof resultFromExplicitError, Result<number, SyntaxError>>>;

const resultFromExplicitAsyncError = resultFrom<{ id: string }, TypeError>(async () => ({ id: "user_123" }));
type ResultFromExplicitAsyncErrorIsTyped = Expect<
  Equal<typeof resultFromExplicitAsyncError, Promise<Result<{ id: string }, TypeError>>>
>;

const promiseLike: PromiseLike<number> = Promise.resolve(42);
const resultFromPromiseLike = resultFrom(() => promiseLike);
type ResultFromPromiseLikeIsTyped = Expect<Equal<typeof resultFromPromiseLike, Promise<Result<number, unknown>>>>;

resultFrom((prefix: string, count: number) => prefix.repeat(count), "x", 2);

// @ts-expect-error resultFrom should preserve wrapped function parameters.
resultFrom((prefix: string, count: number) => prefix.repeat(count), "x", "2");

const authResult: Result<string, Exception<"UNAUTHORIZED" | "FORBIDDEN">> = Math.random() > 0.5
  ? ok("user_123")
  : exception("UNAUTHORIZED", "Sign in is required.");

if (authResult.isErr) {
  const code: "UNAUTHORIZED" | "FORBIDDEN" = authResult.error.code;
  const message: string = authResult.error.message;

  // @ts-expect-error Exception codes stay narrowed to the declared union.
  const wrongCode: "NOT_FOUND" = authResult.error.code;
}

const validationException = exception("VALIDATION_FAILED", "Email is required.");
type ExceptionResultIsTyped = Expect<Equal<typeof validationException, Ex<"VALIDATION_FAILED">>>;

const constructedHttpException = new HttpException(
  new Response("Nope", { status: 400 }),
);
type ConstructedHttpExceptionIsTyped = Expect<
  Equal<typeof constructedHttpException, HttpException<"HTTP_EXCEPTION">>
>;

const httpExceptionResult = httpException(
  new Response("Nope", { status: 400 }),
);
type HttpExceptionResultIsTyped = Expect<
  Equal<typeof httpExceptionResult, Promise<HttpEx<string>>>
>;

async function useHttpExceptionResult() {
  const result = await httpException<"BAD_REQUEST">(
    new Response(
      JSON.stringify({
        code: "BAD_REQUEST",
        message: "Bad request.",
      }),
      { status: 400 },
    ),
  );

  if (result.isErr) {
    const error: HttpException<"BAD_REQUEST"> = result.error;
    const code: "BAD_REQUEST" = result.error.code;
    const message: string = result.error.message;
    const response: Response = result.error.response;
  }
}

const responseException = HttpException.fromResponse<"NOT_FOUND">(
  new Response(
    JSON.stringify({
      code: "NOT_FOUND",
      message: "User not found.",
    }),
  ),
);
type HttpExceptionFromResponseIsTyped = Expect<
  Equal<typeof responseException, Promise<HttpException<"NOT_FOUND">>>
>;

const fetchResult = fetchWithResult("/api/users");

type FetchResultIsTyped = Expect<
  Equal<typeof fetchResult, Promise<Err<Error> | Ok<Response> | HttpEx<string>>>
>;
