const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = requite('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

// Start express app
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) Global Middlewares
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP Headers
app.use(helmet());

// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in and hour',
});

app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // Middleware - Can modify the incoming request data
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Middleware that parses data that comes from a urlencoded form
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization agains XSS attacks
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Compress all text sent to clients
app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// Routes, uses middleware functions
app.use('/', viewRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

/* A parameter can be made optional by adding a ? at the end of the parameter
 app.get('/api/v1/tours/', getAllTours);
 app.post('/api/v1/tours', createTour);
 app.get('/api/v1/tours/:id', getTour);
 app.patch('/api/v1/tours/:id', updateTour);
 app.delete('/api/v1/tours/:id', deleteTour);*/
