import { err } from "./result";

export class Exception<TCode extends string> extends Error {
  code: TCode;

  constructor(code: TCode, message?: string) {
    super(message);
    this.code = code;
  }
}

export function exception<TCode extends string>(code: TCode, message?: string) {
  return err(new Exception(code, message));
}
