const { AuthError } = require('../errors');
const JWTService = require('../services/JWTService');

const tokenInfo = (force = true) => {
  return async (req, res, next) => {
    const handleError = (err) => {
      if (force) {
        next(new AuthError(err?.message));
      } else {
        next();
      }
    };

    const token = req.headers.authorization;
    if (!token || !token.startsWith('Bearer ')) {
      handleError();
      return;
    }

    try {
      const accessToken = token.slice(7);
      const jwtService = new JWTService();
      const authToken = await jwtService.verifyAccessToken(accessToken);

      // set global variable
      req.user = {
        id: authToken.user_id,
      };

      // continue
      next();
    } catch (err) {
      handleError(err);
    }
  };
};

module.exports = tokenInfo;
