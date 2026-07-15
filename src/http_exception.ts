import { Exception } from "./exception";
import { err, type Err } from "./result";
import { resultFrom } from "./result_from";

const DEFAULT_HTTP_EXCEPTION_CODE = "HTTP_EXCEPTION";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

/**
 * Returns a fallback message when the response body cannot provide one.
 */
function messageFromStatus(response: Response) {
  return (
    response.statusText || `HTTP request failed with status ${response.status}`
  );
}

/**
 * Reads the best available code and message from a response.
 */
async function exceptionDataFromResponse<TCode extends string>(
  response: Response,
  fallbackCode: TCode,
) {
  const readResult = await resultFrom(() => response.clone().text());

  if (readResult.isErr) {
    return {
      code: fallbackCode,
      message: messageFromStatus(response),
    };
  }

  const text = readResult.value;

  if (!text) {
    return {
      code: fallbackCode,
      message: messageFromStatus(response),
    };
  }

  const jsonResult = resultFrom(() => JSON.parse(text));

  if (jsonResult.isOk && isRecord(jsonResult.value)) {
    const code =
      typeof jsonResult.value.code === "string" && jsonResult.value.code
        ? (jsonResult.value.code as TCode)
        : fallbackCode;
    const message = jsonResult.value.message;

    if (typeof message === "string" && message) {
      return { code, message };
    }
  }

  return {
    code: fallbackCode,
    message: text,
  };
}

/**
 * HTTP exception with the original response available for inspection.
 */
export class HttpException<
  TCode extends string = "HTTP_EXCEPTION",
> extends Exception<TCode> {
  response: Response;

  /**
   * Creates a coded HTTP exception object.
   */
  constructor(
    response: Response,
    message?: string,
    code = DEFAULT_HTTP_EXCEPTION_CODE as TCode,
  ) {
    super(code, message ?? messageFromStatus(response));
    this.response = response;
  }

  /**
   * Creates an HTTP exception and derives its code and message from the response body.
   */
  static async fromResponse<TCode extends string = string>(
    response: Response,
    code = DEFAULT_HTTP_EXCEPTION_CODE as TCode,
  ) {
    const data = await exceptionDataFromResponse(response, code);

    return new HttpException(response, data.message, data.code);
  }
}

/**
 * Failed result branch containing an `HttpException`.
 */
export type HttpEx<TCode extends string = "HTTP_EXCEPTION"> = Err<
  HttpException<TCode>
>;

/**
 * Creates an `Err` containing an `HttpException` with response-derived code and message.
 */
export async function httpException<
  TCode extends string = string,
>(
  response: Response,
  code = DEFAULT_HTTP_EXCEPTION_CODE as TCode,
): Promise<HttpEx<TCode>> {
  return err(await HttpException.fromResponse(response, code));
}
