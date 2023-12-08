const { AuthError } = require('../errors');
const config = require('../../config/app');

const appKeyCheck = () => {
  return async (req, res, next) => {
    const appKey = req.headers['app-key'];
    if (!appKey) {
      next(new AuthError('app-key is required'));
      return;
    }
    if (!config.appKeys.includes(appKey)) {
      next(new AuthError('Invalid app-key'));
      return;
    }

    // continue
    next();
  };
};

module.exports = appKeyCheck;
