const { getEnv } = require('../app/helpers/utils');

module.exports = {
  // app name
  name: getEnv(process.env.APP_NAME, 'My App'),

  // app environment
  env: getEnv(process.env.APP_ENV, 'local'),

  // enable debug mode
  debug: getEnv(process.env.APP_DEBUG, false),

  // timezone
  timezone: getEnv(process.env.APP_TIMEZONE, '+08:00'),

  // urls
  webUrl: getEnv(process.env.WEB_URL, ''),

  // allowed app keys (this keys will be used to validate some endpoint)
  appKeys: [
    'rZ~3Je9>sdD*M8+QjCh}PmH2', // web key
  ],
};
