const env = require('dotenv');
const express = require('express');
const morgan = require('morgan');

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

// app.get('/', (req, res) => {
//   res.json({ message: 'ok' });
// });

// API routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

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
