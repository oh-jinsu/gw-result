/**
 * Successful result branch returned by `ok`.
 */
export type Ok<T> = {
  isOk: true;
  isErr: false;
  value: T;
};

/**
 * Failed result branch returned by `err`.
 */
export type Err<T> = {
  isOk: false;
  isErr: true;
  error: T;
};

/**
 * A value that is either successful (`Ok<T>`) or failed (`Err<TError>`).
 */
export type Result<T = void, TError = Error> = Ok<T> | Err<TError>;

type Literal = string | number | boolean | bigint | symbol | null | undefined;

/**
 * Creates a successful result.
 *
 * Use `ok()` without a value for operations that only need to signal success.
 */
export function ok<T = void>(value?: T): Ok<T> {
  return { isOk: true, isErr: false, value: value as T };
}

/**
 * Creates a failed result and preserves primitive literal error types.
 */
export function err<T extends Literal>(error: T): Err<T>;

/**
 * Creates a failed result for any error value.
 */
export function err<T>(error?: T): Err<T>;
export function err<T>(error?: T): Err<T> {
  return {
    isOk: false,
    isErr: true,
    error: error as T,
  };
}
