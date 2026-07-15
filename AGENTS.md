# Agent Guide

## Project

`gw-result` is a tiny TypeScript result helper library. The core idea is that
function authors define error contracts by returning `ok(...)` and literal
`err(...)` values, while callers get those contracts through TypeScript
inference without writing `Result<...>` annotations.

## Commands

- `npm run build` builds the package with `tsup`.
- `npm test` builds, runs runtime tests, and runs type tests.
- `npm run test:runtime` runs Node's built-in runtime tests.
- `npm run test:types` runs compile-time TypeScript tests.

## Development Notes

- Keep the public API small and direct. Avoid aliases that do not add behavior.
- Preserve primitive literal error inference for `err("CODE")`.
- Keep generic `Exception` helpers separate from HTTP-specific helpers.
- `HttpException.fromResponse(response)` should parse `{ code, message }` error
  bodies when available, while preserving the original `Response`.
- `fetchWithResult` should keep the simple UI path ergonomic:
  `if (result.isErr) alert(result.error.message)`.
- Do not edit generated `dist` files manually. Use `npm run build`.
- Add or update runtime tests for behavior changes.
- Add or update type tests for public type changes.

## Documentation

- README examples should prefer inferred results over caller-written
  `Result<...>` annotations.
- Changelog entries should describe public API behavior, especially type-level
  changes.
- JSDoc comments are part of the user experience because they appear in IDE
  hovers.
