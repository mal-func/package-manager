/**
 * Base class for expected, operational errors — errors that are a normal
 * part of request handling (bad input, missing resource, denied access)
 * as opposed to programming bugs. This distinction follows the Node.js
 * Best Practices error-handling guidance: operational errors are safe to
 * report to the client via a sanitized message; programming errors are not.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly isOperational = true;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = "The request could not be validated.") {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication is required to access this resource.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action.") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested resource could not be found.") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "The request conflicts with the current state of the resource.") {
    super(message, 409, "CONFLICT");
  }
}
