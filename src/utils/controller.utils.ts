import { HttpException } from '@/exceptions/HttpException';

export function isNull(...args: unknown[]) {
  return args.some(arg => arg == null);
}

export function isNaN(...args: unknown[]) {
  return args.some(arg => Number.isNaN(Number(arg)));
}

export function isNotAString(...args: unknown[]) {
  return args.some(arg => typeof arg !== 'string' || arg.length === 0);
}

export function isNotAFunction(...args: unknown[]) {
  return args.some(arg => typeof arg !== 'function');
}

export function isNotABoolean(...args: unknown[]) {
  return args.some(arg => typeof arg !== 'boolean');
}

export function isNotAnEmail(...args: unknown[]) {
  return args.some(
    arg =>
      !/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        arg as string,
      ),
  );
}

export function throwIfNull(...args: unknown[]) {
  if (isNull(...args)) {
    throw HttpException.MISSING_PARAMETER;
  }
}

export function throwIfNotNumber(...args: unknown[]) {
  if (isNaN(...args) || isNull(...args)) {
    throw HttpException.INVALID_PARAMETER;
  }
}

export function throwIfNotString(...args: string[]) {
  if (isNotAString(...args) || isNull(...args)) {
    throw HttpException.INVALID_PARAMETER;
  }
}

export function throwIfNotEmail(...args: string[]) {
  if (isNotAnEmail(...args) || isNull(...args)) {
    throw HttpException.INVALID_PARAMETER;
  }
}

export function throwIfNotBoolean(...args: boolean[]) {
  if (isNotABoolean(...args) || isNull(...args)) {
    throw HttpException.INVALID_PARAMETER;
  }
}

export function throwIfNotFunction(...args: unknown[]) {
  if (isNotAFunction(...args) || isNull(...args)) {
    throw HttpException.INVALID_PARAMETER;
  }
}
