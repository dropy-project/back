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

export function throwIfNull(...args: unknown[]) {
  if (this.isNull(...args)) {
    throw HttpException.MISSING_PARAMETER;
  }
}

export function throwIfNotNumber(...args: unknown[]) {
  if (this.isNaN(...args) || this.isNull(...args)) {
    throw HttpException.INVALID_PARAMETER;
  }
}

export function throwIfNotString(...args: string[]) {
  if (this.isNotAString(...args) || this.isNull(...args)) {
    throw HttpException.INVALID_PARAMETER;
  }
}
