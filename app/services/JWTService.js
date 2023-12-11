const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { InvalidToken } = require('../errors');
const { AuthToken } = require('../models');
const jwtConfig = require('../../config/jwt');

class JWTService {
  /**
   * Generate access_token for user
   *
   * @param  {model}  user
   * @return {object}
   */
  generateAccessToken(user) {
    // expiry in seconds
    const expiry = Math.floor(Date.now() / 1000) + jwtConfig.expiry.access;
    const token = jwt.sign(
      {
        id: user.id,
        token_type: 'access',
        exp: expiry,
      },
      jwtConfig.secret,
    );

    return {
      token,
      type: 'access',
      expiry: expiry * 1000,
    };
  }

  /**
   * Generate refresh_token for user
   *
   * @param  {model}  user
   * @return {object}
   */
  generateRefreshToken(user) {
    // expiry in seconds
    const expiry = Math.floor(Date.now() / 1000) + jwtConfig.expiry.refresh;
    const token = jwt.sign(
      {
        id: user.id,
        token_type: 'refresh',
        exp: expiry,
      },
      jwtConfig.secret,
    );

    return {
      token,
      type: 'refresh',
      expiry: expiry * 1000,
    };
  }

  /**
   * Generate auth tokens for user
   *
   * @param  {model}  user
   * @param  {array}  useTokens
   * @return {object}
   */
  async generateAuthToken(user, useTokens = ['access', 'refresh']) {
    const tokens = useTokens.map((type) => {
      if (type === 'access') {
        return this.generateAccessToken(user);
      }
      if (type === 'refresh') {
        return this.generateRefreshToken(user);
      }
      return null;
    }).filter((d) => d);

    // DB update
    await this.saveAuthTokens(user, tokens);

    return tokens.reduce((acc, token) => {
      const { type, ...rest } = token;
      acc[type] = rest;

      return acc;
    }, {});
  }

  /**
   * Save JWT tokens to DB
   *
   * @param  {model}  user
   * @param  {array}  tokens - return of generateAuthToken()
   * @return Promise
   */
  async saveAuthTokens(user, tokens) {
    // clean expired token
    await AuthToken.destroy({
      where: {
        expired_at: {
          [Op.lt]: new Date(),
        },
      },
    });

    const dataset = tokens.map(({ token, type, expiry }) => {
      /* eslint-disable object-shorthand */
      return {
        user_id: user.id,
        token: token,
        type: type,
        blacklisted: 0,
        expired_at: new Date(expiry),
        created_at: new Date(),
      };
      /* eslint-enable object-shorthand */
    });

    const results = await AuthToken.bulkCreate(dataset);
    return results;
  }

  /**
   * Verify JWT token
   *
   * @param  {string}  token
   * @param  {type}  type - token type
   * @return Promise
   */
  verifyToken(token, type) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, jwtConfig.secret, (err, decoded) => {
        if (err) {
          reject(err);
        } else if (decoded.token_type !== type) {
          reject(new InvalidToken());
        } else {
          resolve(decoded);
        }
      });
    });
  }

  /**
   * Verify JWT access_token
   *
   * @param  {string}  token
   * @return {model}
   */
  async verifyAccessToken(token) {
    const payload = await this.verifyToken(token, 'access');

    // cross-check with DB
    const authToken = await AuthToken.findOne({
      where: {
        token,
        type: 'access',
        user_id: payload.id,
        blacklisted: 0,
      },
    });
    if (!authToken) {
      throw new InvalidToken('Invalid access token');
    }

    return authToken;
  }

  /**
   * Verify JWT refresh_token
   *
   * @param  {string}  token
   * @return {model}
   */
  async verifyRefreshToken(token) {
    const payload = await this.verifyToken(token, 'refresh');

    // cross-check with DB
    const authToken = await AuthToken.findOne({
      where: {
        token,
        type: 'refresh',
        user_id: payload.id,
        blacklisted: 0,
      },
    });
    if (!authToken) {
      throw new InvalidToken('Invalid refresh token');
    }

    return authToken;
  }

  /**
   * Revoke user tokens
   *
   * @param  {string}  userId
   * @return {model}
   */
  async revoke(userId) {
    const results = await AuthToken.destroy({
      where: {
        user_id: userId,
      },
    });

    return results;
  }
}

module.exports = JWTService;
