const { AuthError } = require('../errors');
const JWTService = require('../services/JWTService');

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token || !token.startsWith('Bearer ')) {
    next(new AuthError());
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
    next(new AuthError(err.message));
  }
};

module.exports = authenticate;
