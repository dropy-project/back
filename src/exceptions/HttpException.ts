export class HttpException extends Error {
  static MISSING_PARAMETER = new HttpException(400, 'Missing parameter');
  static INVALID_PARAMETER = new HttpException(400, 'Invalid parameter');
  static INVALID_TOKEN = new HttpException(403, 'Invalid token');

  public status: number;
  public message: string;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
