import { resultFrom } from "./result_from";

export function fetchWithResult(...args: Parameters<typeof fetch>) {
  return resultFrom(() => fetch(...args));
}
