import { err, type Err } from "./result";

export class Exception<TCode extends string = string> {
  code: TCode;
  message: string;

  constructor(code: TCode, message: string) {
    this.code = code;
    this.message = message;
  }
}

export type Ex<TCode extends string> = Err<Exception<TCode>>;

export function exception<TCode extends string>(
  code: TCode,
  message: string,
): Ex<TCode> {
  return err(new Exception(code, message));
}

export async function exceptionFromResponse<TCode extends string = string>(
  response: Response,
) {
  const { code, message } = await response.json();

  return exception(code as TCode, message);
}
