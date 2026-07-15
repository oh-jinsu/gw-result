import assert from "node:assert/strict";
import { test } from "node:test";
import {
  Exception,
  HttpException,
  err,
  exception,
  fetchWithResult,
  httpException,
  ok,
  resultFrom,
} from "../../dist/index.mjs";

test("ok creates a successful result", () => {
  assert.deepEqual(ok(123), {
    isOk: true,
    isErr: false,
    value: 123,
  });
});

test("err creates a failed result", () => {
  const error = new Error("Nope");

  assert.deepEqual(err(error), {
    isOk: false,
    isErr: true,
    error,
  });
});

test("resultFrom wraps synchronous return values", () => {
  const result = resultFrom((value) => value * 2, 21);

  assert.deepEqual(result, ok(42));
});

test("resultFrom wraps synchronous thrown errors", () => {
  const thrown = new Error("Boom");
  const result = resultFrom(() => {
    throw thrown;
  });

  assert.equal(result.isErr, true);
  assert.equal(result.error, thrown);
});

test("resultFrom wraps asynchronous return values", async () => {
  const result = await resultFrom(async (value) => value.toUpperCase(), "ok");

  assert.deepEqual(result, ok("OK"));
});

test("resultFrom wraps asynchronous rejected errors", async () => {
  const rejected = new Error("Rejected");
  const result = await resultFrom(async () => {
    throw rejected;
  });

  assert.equal(result.isErr, true);
  assert.equal(result.error, rejected);
});

test("resultFrom wraps promise-like return values", async () => {
  const result = await resultFrom(() => ({
    then(resolve) {
      resolve("thenable");
    },
  }));

  assert.deepEqual(result, ok("thenable"));
});

test("exception creates a coded error result", () => {
  const result = exception("VALIDATION_FAILED", "Email is required.");

  assert.equal(result.isErr, true);
  assert.ok(result.error instanceof Exception);
  assert.equal(result.error.code, "VALIDATION_FAILED");
  assert.equal(result.error.message, "Email is required.");
});

test("HttpException uses response status text when no message is provided", () => {
  const response = new Response("Nope", {
    status: 400,
    statusText: "Bad Request",
  });
  const exception = new HttpException(response);

  assert.ok(exception instanceof Exception);
  assert.equal(exception.code, "HTTP_EXCEPTION");
  assert.equal(exception.message, "Bad Request");
  assert.equal(exception.response, response);
});

test("httpException creates a coded HTTP error result from a response", async () => {
  const response = new Response(
    JSON.stringify({
      code: "BAD_REQUEST",
      message: "Bad request.",
    }),
    { status: 400 },
  );
  const result = await httpException(response);

  assert.equal(result.isErr, true);
  assert.ok(result.error instanceof Exception);
  assert.ok(result.error instanceof HttpException);
  assert.equal(result.error.code, "BAD_REQUEST");
  assert.equal(result.error.message, "Bad request.");
  assert.equal(result.error.response, response);
  assert.deepEqual(await result.error.response.json(), {
    code: "BAD_REQUEST",
    message: "Bad request.",
  });
});

test("HttpException.fromResponse reads code and message from JSON", async () => {
  const response = new Response(
    JSON.stringify({
      code: "NOT_FOUND",
      message: "User not found.",
    }),
    { status: 404 },
  );

  const exception = await HttpException.fromResponse(response);

  assert.ok(exception instanceof Exception);
  assert.equal(exception.code, "NOT_FOUND");
  assert.equal(exception.message, "User not found.");
  assert.equal(exception.response, response);
});

test("fetchWithResult returns an ok response for successful requests", async (t) => {
  const originalFetch = globalThis.fetch;
  const response = new Response("ok", { status: 200 });

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (input) => {
    assert.equal(input, "https://example.com/users");
    return response;
  };

  const result = await fetchWithResult("https://example.com/users");

  assert.equal(result.isOk, true);
  assert.equal(result.value, response);
});

test("fetchWithResult returns a failed result for network errors", async (t) => {
  const originalFetch = globalThis.fetch;
  const error = new Error("Network failed");

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () => {
    throw error;
  };

  const result = await fetchWithResult("https://example.com/users");

  assert.equal(result.isErr, true);
  assert.equal(result.error, error);
});

test("fetchWithResult uses JSON message fields for failed HTTP responses", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        code: "FORBIDDEN",
        message: "Permission denied.",
      }),
      { status: 403 },
    );

  const result = await fetchWithResult("https://example.com/private");

  assert.equal(result.isErr, true);
  assert.ok(result.error instanceof Exception);
  assert.ok(result.error instanceof HttpException);
  assert.equal(result.error.code, "FORBIDDEN");
  assert.equal(result.error.message, "Permission denied.");
  assert.equal(result.error.response.status, 403);
  assert.deepEqual(await result.error.response.json(), {
    code: "FORBIDDEN",
    message: "Permission denied.",
  });
});

test("fetchWithResult falls back to response text for failed HTTP responses", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () => new Response("Server exploded.", { status: 500 });

  const result = await fetchWithResult("https://example.com/error");

  assert.equal(result.isErr, true);
  assert.ok(result.error instanceof Exception);
  assert.ok(result.error instanceof HttpException);
  assert.equal(result.error.code, "HTTP_EXCEPTION");
  assert.equal(result.error.message, "Server exploded.");
  assert.equal(result.error.response.status, 500);
  assert.equal(await result.error.response.text(), "Server exploded.");
});
