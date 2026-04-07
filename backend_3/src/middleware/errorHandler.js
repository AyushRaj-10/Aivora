import logger from '../utils/logger.js';

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error('[ErrorHandler]', { message: err.message, stack: err.stack });

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
}

export default errorHandler;