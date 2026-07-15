# Changelog

## 0.3.0 - 2026-07-15

### Added

- Added `HttpException`, `HttpEx`, and `httpException` for HTTP response errors.
- Added `HttpException.fromResponse(response, code?)` to derive `code` and `message` from server error responses shaped like `{ code, message }`.
- Added runtime tests with Node's built-in test runner.
- Added TypeScript type tests for inferred result contracts and public return types.
- Added JSDoc comments for exported APIs.

### Changed

- `fetchWithResult` now returns `HttpEx<string>` for non-OK HTTP responses.
- `fetchWithResult` now preserves the original response on `error.response`.
- `fetchWithResult` now derives `error.code` and `error.message` from JSON error bodies when possible.
- `err("CODE")` now preserves primitive literal error types.
- `resultFrom` now types caught or rejected values as `unknown` by default.
- `resultFrom` now supports `PromiseLike` values, not only native `Promise` instances.
- README now emphasizes inferred error contracts from function authors.

### Removed

- Removed `exceptionFromResponse`; use `HttpException.fromResponse(response)` instead.
