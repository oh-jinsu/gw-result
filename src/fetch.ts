import { httpException } from "./http_exception";
import { ok } from "./result";
import { resultFrom } from "./result_from";

/**
 * Calls `fetch` and returns a result instead of throwing.
 *
 * Network failures become `Err<Error>`. Non-OK HTTP responses become
 * `Err<HttpException<string>>` with code and message from the response body.
 */
export async function fetchWithResult(...args: Parameters<typeof fetch>) {
  const result = await resultFrom<Response, Error>(() => fetch(...args));

  if (result.isErr) {
    return result;
  }

  const response = result.value;

  if (!response.ok) {
    return httpException(response);
  }

  return ok(response);
}
