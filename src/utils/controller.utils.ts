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

export function throwIfNotFunction(...args: unknown[]) {
  if (isNotAFunction(...args) || isNull(...args)) {
    throw HttpException.INVALID_PARAMETER;
  }
}
