import { exception } from "./exception";
import { ok } from "./result";
import { resultFrom } from "./result_from";

export async function fetchWithResult(...args: Parameters<typeof fetch>) {
  const result = await resultFrom(() => fetch(...args));

  if (result.isErr) {
    return result;
  }

  const response = result.value;

  if (!response.ok) {
    const readResult = await resultFrom(() => response.text());

    if (readResult.isOk) {
      const text = readResult.value;

      const jsonResult = await resultFrom(() => JSON.parse(text));

      if (jsonResult.isOk) {
        const message = jsonResult.value?.message;

        if (message) {
          return exception("REQUEST_FAILED", message);
        }
      }

      return exception("REQUEST_FAILED", text);
    }

    return exception(
      "REQUEST_FAILED",
      "요청이 실패했습니다. 응답을 읽을 수 없습니다.",
    );
  }

  return ok(response);
}
