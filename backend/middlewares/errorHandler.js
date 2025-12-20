const { StatusCodes } = require('http-status-codes');
const { ZodError } = require('zod');
const AppError = require('../utils/appError');

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, StatusCodes.NOT_FOUND));
};

const errorHandler = (error, req, res, next) => {
  const isKnownError = error instanceof AppError;
  const statusCode = isKnownError ? error.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
  const message = isKnownError ? error.message : 'Something went wrong';
  const details = error instanceof ZodError ? error.flatten() : error.details;

  if (!isKnownError) {
    console.error('[ERROR]', error);
  }

  res.status(statusCode).json({
    message,
    details,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
