const path = require('path');
const env = require('dotenv');
const express = require('express');
const i18n = require('i18n');
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

// i18n setup
i18n.configure({
  locales: ['en'],
  defaultLocale: 'en',
  cookie: 'lang',
  directory: path.join(__dirname, 'locales'),
  objectNotation: true,
  // updateFiles: false,
  // logDebugFn: function (msg) {
  //   console.log('debug', msg)
  // },
});
app.use(i18n.init);

// app.get('/', (req, res) => {
//   res.json({ message: 'ok' });
// });

// API routes
const apiRoutes = require('./routes/admin');
app.use('/admin', apiRoutes);

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
