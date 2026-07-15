import { err, type Err } from "./result";

/**
 * Error object with a stable machine-readable code and human-readable message.
 */
export class Exception<TCode extends string = string> {
  code: TCode;
  message: string;

  /**
   * Creates a coded exception object.
   */
  constructor(code: TCode, message: string) {
    this.code = code;
    this.message = message;
  }
}

/**
 * Failed result branch containing an `Exception`.
 */
export type Ex<TCode extends string> = Err<Exception<TCode>>;

/**
 * Creates an `Err` containing an `Exception` with the given code and message.
 */
export function exception<TCode extends string>(
  code: TCode,
  message: string,
): Ex<TCode> {
  return err(new Exception(code, message));
}
