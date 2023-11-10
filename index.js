const express = require('express');
const env = require('dotenv');
const morgan = require('morgan');

// Init services
env.config();
const app = express();
const port = process.env.APP_PORT;

// Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(
  express.urlencoded({
    extended: true,
  }),
);
// i18n setup
app.use(require('./app/providers/i18n').init);

// ping
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// API routes
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));

// error middleware
app.use(require('./app/middlewares/errorHandler'));

// global handle for Promise
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Handle the error here
  // Note: You might want to log the error or perform additional actions
});

// DB connection
const { sequelize } = require('./app/models');
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to the database');

    // start app
    app.listen(port, () => {
      console.log(`App listening at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error);
  }
})();
