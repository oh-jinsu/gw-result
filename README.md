# gw-result

Tiny TypeScript helpers for returning success and failure as explicit values.

`gw-result` gives you a small `Result` union, helpers for wrapping throwing
functions, typed application exceptions, and a `fetch` wrapper that returns a
result instead of throwing.

- Zero runtime dependencies
- TypeScript-first API with discriminated unions
- Works with synchronous and asynchronous functions
- Exports ESM and CommonJS builds

## Installation

```sh
npm install gw-result
```

```sh
pnpm add gw-result
```

```sh
yarn add gw-result
```

## Quick Start

```ts
import { err, ok } from "gw-result";

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

const result = parsePort("3000");

if (result.isOk) {
  console.log(result.value);
} else {
  console.error(result.error);
}
```

`isOk` and `isErr` are boolean discriminants, so TypeScript narrows the result
for you inside each branch.

## Inferred Error Contracts

The most useful part of `gw-result` is that small functions do not need return
type annotations. Function authors define the error contract by returning
literal `err(...)` values, and callers get that contract from TypeScript without
writing a `Result<...>` type themselves.

```ts
import { err, ok } from "gw-result";

function loadConfig(raw?: { port?: number }) {
  if (!raw) {
    return err("EMPTY_CONFIG");
  }

  if (typeof raw.port !== "number") {
    return err("MISSING_PORT");
  }

  return ok({ port: raw.port });
}

const result = loadConfig({ port: 3000 });

if (result.isErr) {
  result.error;
  // ^? "EMPTY_CONFIG" | "MISSING_PORT"
}
```

Primitive error values keep their literal types, so `err("EMPTY_CONFIG")` is an
`Err<"EMPTY_CONFIG">`, not just `Err<string>`.

## Result

```ts
type Result<T = void, TError = Error> = Ok<T> | Err<TError>;

type Ok<T> = {
  isOk: true;
  isErr: false;
  value: T;
};

type Err<T> = {
  isOk: false;
  isErr: true;
  error: T;
};
```

Create success and error values with `ok` and `err`:

```ts
import { err, ok } from "gw-result";

const created = ok({ id: "user_123" });
const failed = err(new Error("User already exists"));
```

Primitive error values keep their literal type:

```ts
import { err, ok } from "gw-result";

function findUser(id: string) {
  if (!id) {
    return err("MISSING_ID");
  }

  return ok({ id });
}

const result = findUser("user_123");
```

Use `ok()` without an argument for operations that only need to signal success:

```ts
import { ok } from "gw-result";

function saveSettings() {
  // Save settings here.
  return ok();
}
```

## Wrapping Functions

Use `resultFrom` when you want to convert thrown errors or rejected promises into
an `Err`.

```ts
import { resultFrom } from "gw-result";

const parsed = resultFrom(JSON.parse, '{"enabled":true}');

if (parsed.isErr) {
  console.error(parsed.error);
}
```

It also works with async functions:

```ts
import { resultFrom } from "gw-result";

async function loadUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

const userResult = await resultFrom(loadUser, "user_123");

if (userResult.isErr) {
  console.error(userResult.error);
  return;
}

console.log(userResult.value);
```

The error value is whatever the wrapped function throws or rejects with. Throwing
`Error` instances gives the best runtime ergonomics, but JavaScript can throw
anything, so `resultFrom` types caught errors as `unknown` by default.

When you know the value and error types at a boundary, pass them explicitly:

```ts
import { resultFrom } from "gw-result";

type Config = {
  enabled: boolean;
};

const parsed = resultFrom<Config, SyntaxError>(() =>
  JSON.parse('{"enabled":true}') as Config,
);
```

`resultFrom` treats any `PromiseLike` value as async, not only native `Promise`
instances.

## Exceptions

Use `Exception` when your application errors should carry a stable code and a
human-readable message.

```ts
import { exception, ok } from "gw-result";

type User = {
  id: string;
  role: "admin" | "member";
};

function requireAdmin(user?: User) {
  if (!user) {
    return exception("UNAUTHORIZED", "Sign in is required.");
  }

  if (user.role !== "admin") {
    return exception("FORBIDDEN", "You do not have access.");
  }

  return ok(user);
}
```

`exception(code, message)` returns an `Err<Exception<TCode>>`:

```ts
const result = exception("VALIDATION_FAILED", "Email is required.");

if (result.isErr) {
  console.log(result.error.code);
  console.log(result.error.message);
}
```

## Fetch

`fetchWithResult` wraps the platform `fetch` API and returns a result.

```ts
import { fetchWithResult } from "gw-result";

const result = await fetchWithResult("/api/users");

if (result.isErr) {
  alert(result.error.message);
  return;
}

const users = await result.value.json();
console.log(users);
```

Behavior:

- Network errors become `Err<Error>`.
- Successful HTTP responses become `Ok<Response>`.
- Non-2xx responses become `Err<HttpException<string>>`.
- For failed HTTP responses, `HttpException.code` and `HttpException.message`
  are derived from a JSON `{ code, message }` body when present.
- If no JSON message exists, `HttpException.message` falls back to body text,
  `statusText`, or the HTTP status.
- The `HttpException` response is available as `error.response` for status,
  headers, and body inspection.

When you need HTTP details, import `HttpException` and narrow the error:

```ts
import { fetchWithResult, HttpException } from "gw-result";

const result = await fetchWithResult("/api/users");

if (result.isErr && result.error instanceof HttpException) {
  console.log(result.error.response.status);
}
```

You can also parse an HTTP exception response directly:

```ts
import { HttpException } from "gw-result";

const error = await HttpException.fromResponse<"NOT_FOUND">(response);
```

`fetchWithResult` requires a runtime that provides global `fetch`, such as modern
browsers, Node.js 18+, Bun, or Deno.

## API Reference

| Export | Description |
| --- | --- |
| `Result<T, TError>` | Union of `Ok<T>` and `Err<TError>`. |
| `Ok<T>` | Successful result shape. |
| `Err<T>` | Failed result shape. |
| `ok(value?)` | Creates an `Ok` result. |
| `err(error?)` | Creates an `Err` result and preserves primitive error literals. |
| `resultFrom(fn, ...args)` | Wraps a sync, async, or `PromiseLike` function in a `Result`; caught errors default to `unknown`. |
| `Exception<TCode>` | Error class with `code` and `message`. |
| `Ex<TCode>` | Alias for `Err<Exception<TCode>>`. |
| `exception(code, message)` | Creates an exception result. |
| `HttpException<TCode>` | HTTP error class with `code`, `message`, and `response`. |
| `HttpEx<TCode>` | Alias for `Err<HttpException<TCode>>`. |
| `httpException(response, code?)` | Creates an HTTP exception result with response-derived code and message. |
| `HttpException.fromResponse(response, code?)` | Creates an HTTP exception from a response body. |
| `fetchWithResult(...args)` | Fetch wrapper that returns `Ok<Response>` or `Err`. |

## Development

```sh
npm install
npm run build
npm test
```

The package is built with `tsup` and emits type declarations to `dist`.

## License

MIT
