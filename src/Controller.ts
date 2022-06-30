import { HttpException } from '@/exceptions/HttpException';

export abstract class Controller {
  protected isNull(...args: unknown[]) {
    return args.some(arg => arg == null);
  }

  protected isNaN(...args: unknown[]) {
    return args.some(arg => Number.isNaN(Number(arg)));
  }

  protected isNotAString(...args: unknown[]) {
    return args.some(arg => typeof arg !== 'string' || arg.length === 0);
  }

  protected throwIfNull(...args: unknown[]) {
    if (this.isNull(...args)) {
      throw HttpException.MISSING_PARAMETER;
    }
  }

  protected throwIfNotNumber(...args: unknown[]) {
    if (this.isNaN(...args) || this.isNull(...args)) {
      throw HttpException.INVALID_PARAMETER;
    }
  }

  protected throwIfNotString(...args: string[]) {
    if (this.isNotAString(...args) || this.isNull(...args)) {
      throw HttpException.INVALID_PARAMETER;
    }
  }
}
