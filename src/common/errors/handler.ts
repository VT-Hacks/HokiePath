import { Request, Response, NextFunction } from 'express';
import {
  APIError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
  ConflictError,
  UnprocessableEntityError,
  RequestTimeoutError,
  TooManyRequestsError,
} from './error';
import { logger } from '../logger';
import { ZodError } from 'zod';

export const HandleErrorWithLogger = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let reportError = true;
  let status = 500;
  let data = error.message;

  // skipping common/known errors
  [
    NotFoundError,
    ValidationError,
    ForbiddenError,
    APIError,
    UnauthorizedError,
    ConflictError,
    UnprocessableEntityError,
    RequestTimeoutError,
    TooManyRequestsError,
  ].forEach((typeOfError) => {
    if (error instanceof typeOfError) {
      status = error.status;
      data = error.message;
    }
  });
  // Validation(Zod) Error's
  if (error instanceof ZodError) {
    console.log(error);
    const formattedErrors = error.issues.map((e) => ({
      field: e.path.join('.'),
      error: e.message,
    }));
    return res.status(400).json({ error: formattedErrors });
  }
  if (reportError) {
    // error reporting tools implementation eg: Cloudwatch,Sentry etc;
    logger.error('error');
  } else {
    logger.warn('warm'); // ignore common errors caused by user
  }

  return res.status(status).json({ error: data });
};

export const HandleUnCaughtException = async (error: Error) => {
  logger.error(error);
  process.exit(1);
};
