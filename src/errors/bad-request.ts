/* eslint-disable max-classes-per-file */
import ApplicationError from './application-error';

export class BadRequest extends ApplicationError {
  constructor(message?: string, code = 400) {
    super(message || 'Bad request', code);
  }
}

export class Unauthorized extends ApplicationError {
  constructor(message?: string, code = 401) {
    super(message || 'Unauthorized', code);
  }
}

export class Forbidden extends ApplicationError {
  constructor(message?: string, code = 403) {
    super(message || 'Forbidden', code);
  }
}

export class NotFound extends ApplicationError {
  constructor(message?: string, code = 404) {
    super(message || 'Not found', code);
  }
}
