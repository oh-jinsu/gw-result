import assert from "node:assert/strict";
import { test } from "node:test";
import {
  Exception,
  err,
  exception,
  exceptionFromResponse,
  fetchWithResult,
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

test("exception creates a coded error result", () => {
  const result = exception("VALIDATION_FAILED", "Email is required.");

  assert.equal(result.isErr, true);
  assert.ok(result.error instanceof Exception);
  assert.equal(result.error.code, "VALIDATION_FAILED");
  assert.equal(result.error.message, "Email is required.");
});

test("exceptionFromResponse reads code and message from JSON", async () => {
  const response = new Response(
    JSON.stringify({
      code: "NOT_FOUND",
      message: "User not found.",
    }),
    { status: 404 },
  );

  const result = await exceptionFromResponse(response);

  assert.equal(result.isErr, true);
  assert.ok(result.error instanceof Exception);
  assert.equal(result.error.code, "NOT_FOUND");
  assert.equal(result.error.message, "User not found.");
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
    new Response(JSON.stringify({ message: "Permission denied." }), {
      status: 403,
    });

  const result = await fetchWithResult("https://example.com/private");

  assert.equal(result.isErr, true);
  assert.ok(result.error instanceof Exception);
  assert.equal(result.error.code, "REQUEST_FAILED");
  assert.equal(result.error.message, "Permission denied.");
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
  assert.equal(result.error.code, "REQUEST_FAILED");
  assert.equal(result.error.message, "Server exploded.");
});
