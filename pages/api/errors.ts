export class HttpError extends Error {
  statusCode: number;
  constructor(status: number, message?: string) {
    super(message);
    this.statusCode = status;
  }
};

export class Unauthorized extends HttpError {
  constructor(message?: string) {
    super(401, message ?? "You are not authorized");
  }
};