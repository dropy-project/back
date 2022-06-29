import { HttpException } from '@/exceptions/HttpException';

export abstract class Controller {
  protected isNotSet(...args: unknown[]) {
    return args.some(arg => arg == null);
  }

  protected isNan(...args: unknown[]) {
    return args.some(arg => Number.isNaN(Number(arg)));
  }

  protected checkForNotSet(...args: unknown[]) {
    if (this.isNotSet(...args)) {
      throw HttpException.MISSING_PARAMETER;
    }
  }

  protected checkForNan(...args: unknown[]) {
    if (this.isNan(...args)) {
      throw HttpException.INVALID_PARAMETER;
    }
  }
}
