const { getEnv } = require('./utils');

module.exports = {
  secret: getEnv(process.env.JWT_SECRET, 'my_secret_key'),

  expiry: {
    access: parseFloat(getEnv(process.env.JWT_ACCESS_EXPIRY, '3600')),
    refresh: parseFloat(getEnv(process.env.JWT_REFRESH_EXPIRY, '86400')),
  },
};
