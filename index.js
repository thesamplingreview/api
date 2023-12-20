const express = require('express');
const env = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

// Init services
env.config();
const app = express();
const port = process.env.APP_PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(
  express.urlencoded({
    extended: true,
  }),
);
// i18n setup
const { i18n } = require('./app/helpers/locale');
app.use(i18n.init);

// ping
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// API routes
app.use('/v1', require('./routes/v1/index'));

// 404 routes
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

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
