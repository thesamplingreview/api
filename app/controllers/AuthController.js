const ApiController = require('./ApiController');
const AuthService = require('../services/AuthService');
const JWTService = require('../services/JWTService');
const UserResource = require('../resources/UserResource');
const { UserRole } = require('../models');

class AuthController extends ApiController {
  constructor() {
    super();

    this.authService = new AuthService();
    this.jwtService = new JWTService();
  }

  /**
   * GET - token validation
   */
  async validate(req, res) {
    return this.responseJson(req, res, {
      message: 'ok',
      data: req.user.id,
    });
  }

  /**
   * GET - my
   */
  async my(req, res) {
    try {
      const user = await this.authService.getUser(req.user.id, {
        include: [UserRole],
      });

      return this.responseJson(req, res, {
        data: new UserResource(user),
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * POST - login
   */
  async login(req, res) {
    // validated
    const formData = {
      email: req.body.email,
      password: req.body.password,
    };

    try {
      const { user, tokens } = await this.authService.loginWithPassword(formData);

      return this.responseJson(req, res, {
        data: {
          jwt: tokens,
          user: new UserResource(user),
        },
      });
    } catch (err) {
      err.message = req.__('validation.auth'); // mask error
      return this.responseError(req, res, err);
    }
  }

  /**
   * POST - token refresh
   */
  async tokenRefresh(req, res) {
    // validated
    const formData = {
      refresh_token: req.body.refresh_token,
    };

    try {
      const authToken = await this.jwtService.verifyRefreshToken(formData.refresh_token);
      const user = await authToken.getUser();

      const tokens = await this.jwtService.generateAuthToken(user, ['access']);

      return this.responseJson(req, res, {
        data: {
          jwt: tokens,
        },
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * POST - invalidate token - clear all user authTokens
   */
  async invalidate(req, res) {
    try {
      const user = await this.authService.getUser(req.user.id);
      await this.jwtService.revoke(user);

      return this.responseJson(req, res, {
        message: 'Access revoked.',
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }
}

module.exports = AuthController;
