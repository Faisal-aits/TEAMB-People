const sendResponse = require('../utils/response');
const logger = require('./logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  logger.error('Unhandled error', {
    path: req.originalUrl,
    method: req.method,
    statusCode,
    error: err.message,
    stack: err.stack,
  });

  sendResponse(res, statusCode, false, err.message || 'Internal Server Error', null);
};

module.exports = errorHandler;
