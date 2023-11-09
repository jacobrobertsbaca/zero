export class HttpError extends Error {
  statusCode: number;
  constructor(status: number | string, message?: string) {
    super(message);
    this.statusCode = typeof status === "string" ? parseInt(status, 10) : status;
    if (isNaN(this.statusCode)) this.statusCode = 500;
  }
};

export class Unauthorized extends HttpError {
  constructor(message?: string) {
    super(401, message ?? "You are not authorized");
  }
};

export class NotFound extends HttpError {
  constructor(message?: string) {
    super(404, message ?? "Resource could not be found");
  }
};