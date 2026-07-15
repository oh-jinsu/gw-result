# Claude Notes

Use `AGENTS.md` as the source of truth for repository guidance.

Important package intent:

- Keep the library small.
- Favor inferred error contracts from `ok(...)` and literal `err(...)`.
- Keep generic exceptions and HTTP exceptions separated.
- Keep `fetchWithResult` easy to consume through `error.message`.
- Run `npm test` before considering changes complete.

When updating docs, avoid examples where callers manually write
`Result<Value, ErrorCode>` unless the example is specifically about the
`Result` type itself.
