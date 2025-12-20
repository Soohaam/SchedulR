const { StatusCodes } = require('http-status-codes');
const { ZodError } = require('zod');
const AppError = require('../utils/appError');

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, StatusCodes.NOT_FOUND));
};

const errorHandler = (error, req, res, next) => {
  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Invalid JSON format in request body',
      details: error.message,
    });
  }

  const isKnownError = error instanceof AppError;
  const statusCode = isKnownError ? error.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
  const message = isKnownError ? error.message : 'Something went wrong';
  const details = error instanceof ZodError ? error.flatten() : error.details;

  if (!isKnownError) {
    // Safely log error to avoid issues with circular references or undefined properties
    console.error('[ERROR]', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name,
    });
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
