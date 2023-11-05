const { getEnv } = require('../app/helpers/utils');

module.exports = {
  // app name
  name: getEnv(process.env.APP_NAME, 'My App'),

  // app environment
  env: getEnv(process.env.APP_ENV, 'local'),

  // enable debug mode
  debug: getEnv(process.env.APP_DEBUG, false),
};
