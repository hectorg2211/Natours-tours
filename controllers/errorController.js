const AppError = require('../utils/AppError');

const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (error) => {
  const value = error.errmsg.match(/(["'])(\\?.)*?\1/[0]);
  // console.log(value);
  const message = `Duplicate fiel value: ${value} Please use another value!`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (error) => {
  const errors = Object.values(error.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token, Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired, Please log in again.', 401);

const sendErrorDev = (error, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      error: error,
      stack: error.stack,
    });
  } else {
    // RENDERED WEBSITE
    return res.status(error.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: error.message,
    });
  }
};

const sendErrorProd = (error, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
    }
    // Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('💥 ERROR 💥', error);

    //2) Send a generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
  // Rendered website
  if (error.isOperational) {
    return res.status(error.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: error.message,
    });

    // Programming or other unknown error: don't leak error details
  }
  // 1) Log error
  console.error('💥 ERROR 💥', error);

  //2) Send a generic message
  return res.status(error.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let err = Object.assign(error);
    // console.log('Here the error', err);
    err.message = error.message;
    if (err.name === 'CastError') err = handleCastErrorDB(err);
    if (err.code === 11000) err = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') err = handleJWTError();
    if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();
    sendErrorProd(err, req, res);
  }
};
