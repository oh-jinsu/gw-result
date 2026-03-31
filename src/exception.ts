import { err } from "./result";

export class Exception extends Error {
  code: string;

  constructor(code: string, message?: string) {
    super(message);
    this.code = code;
  }
}

export function exception(code: string, message?: string) {
  return err(new Exception(code, message));
}
