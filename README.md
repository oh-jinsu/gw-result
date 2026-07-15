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
import { err, ok, type Result } from "gw-result";

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

const result: Result<number, "EMPTY" | "INVALID"> = parsePort("3000");

if (result.isOk) {
  console.log(result.value);
} else {
  console.error(result.error);
}
```

`isOk` and `isErr` are boolean discriminants, so TypeScript narrows the result
for you inside each branch.

The function does not need a return type annotation. `err("EMPTY")` and
`err("INVALID")` are inferred as literal error branches, and callers can use an
explicit `Result` type at module or API boundaries.

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
import { err, ok, type Result } from "gw-result";

function findUser(id: string) {
  if (!id) {
    return err("MISSING_ID");
  }

  return ok({ id });
}

const result: Result<{ id: string }, "MISSING_ID"> = findUser("user_123");
```

Use `ok()` without an argument for operations that only need to signal success:

```ts
import { ok, type Result } from "gw-result";

function saveSettings(): Result {
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
`Error` instances gives the best TypeScript ergonomics.

## Exceptions

Use `Exception` when your application errors should carry a stable code and a
human-readable message.

```ts
import { exception, ok, type Exception, type Result } from "gw-result";

type AuthCode = "UNAUTHORIZED" | "FORBIDDEN";

type User = {
  id: string;
  role: "admin" | "member";
};

function requireAdmin(user?: User): Result<User, Exception<AuthCode>> {
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

If your API returns JSON shaped like `{ "code": "...", "message": "..." }`, use
`exceptionFromResponse`:

```ts
import { exceptionFromResponse } from "gw-result";

const result = await exceptionFromResponse<"NOT_FOUND">(response);
```

## Fetch

`fetchWithResult` wraps the platform `fetch` API and returns a result.

```ts
import { fetchWithResult } from "gw-result";

const result = await fetchWithResult("/api/users");

if (result.isErr) {
  console.error(result.error.message);
  return;
}

const users = await result.value.json();
console.log(users);
```

Behavior:

- Network errors become `Err<Error>`.
- Successful HTTP responses become `Ok<Response>`.
- Non-2xx responses become `Err<Exception<"REQUEST_FAILED">>`.
- For failed HTTP responses, the exception message is derived from the response
  body text, or from a JSON `message` field when present.

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
| `resultFrom(fn, ...args)` | Wraps a sync or async function in a `Result`. |
| `Exception<TCode>` | Error class with `code` and `message`. |
| `Ex<TCode>` | Alias for `Err<Exception<TCode>>`. |
| `exception(code, message)` | Creates an exception result. |
| `exceptionFromResponse(response)` | Reads `{ code, message }` from a response and returns an exception result. |
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
