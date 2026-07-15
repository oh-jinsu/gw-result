export type Ok<T> = {
  isOk: true;
  isErr: false;
  value: T;
};

export type Err<T> = {
  isOk: false;
  isErr: true;
  error: T;
};

export type Result<T = void, TError = Error> = Ok<T> | Err<TError>;

type Literal = string | number | boolean | bigint | symbol | null | undefined;

export function ok<T = void>(value?: T): Ok<T> {
  return { isOk: true, isErr: false, value: value as T };
}

export function err<T extends Literal>(error: T): Err<T>;
export function err<T>(error?: T): Err<T>;
export function err<T>(error?: T): Err<T> {
  return {
    isOk: false,
    isErr: true,
    error: error as T,
  };
}
