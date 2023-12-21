const ApiController = require('../ApiController');
const AuthService = require('../../services/AuthService');
const JWTService = require('../../services/JWTService');
const CustomerService = require('../../services/CustomerService');
const UserResource = require('../../resources/UserResource');
const { sequelize } = require('../../models');
const { ValidationFailed } = require('../../errors');

class AuthController extends ApiController {
  constructor() {
    super();

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
   * POST - login
   */
  async login(req, res) {
    // validated
    const formData = {
      email: req.body.email,
      password: req.body.password,
    };

    const authService = new AuthService();
    const t = await sequelize.transaction();
    try {
      const { user, tokens } = await authService.loginWithPassword(formData);

      user.last_login = new Date();
      await user.save();

      await t.commit();
      return this.responseJson(req, res, {
        data: {
          jwt: tokens,
          user: new UserResource(user),
        },
      });
    } catch (err) {
      await t.rollback();
      err.message = req.__('validation.auth'); // mask error
      return this.responseError(req, res, err);
    }
  }

  /**
   * POST - signup
   */
  async signup(req, res) {
    // validated
    const formData = {
      email: req.body.email,
      name: req.body.name,
      password: req.body.password,
      contact: req.body.contact,
    };

    const customerService = new CustomerService();
    const t = await sequelize.transaction();
    try {
      const result = await customerService.create(formData, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new UserResource(result),
      });
    } catch (err) {
      await t.rollback();
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
      await this.jwtService.revoke(req.user.id);

      return this.responseJson(req, res, {
        message: 'Access revoked.',
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * POST - login using Google
   */
  async loginWithGoogle(req, res) {
    // validated
    const formData = {
      email: req.body.email,
      token: req.body.token,
    };

    const authService = new AuthService();
    const t = await sequelize.transaction();
    try {
      const { user, tokens } = await authService.loginWithGoogle(formData);

      user.last_login = new Date();
      await user.save();

      await t.commit();
      return this.responseJson(req, res, {
        data: {
          jwt: tokens,
          user: new UserResource(user),
        },
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }

  /**
   * POST - signup with Google
   */
  async signupWithGoogle(req, res) {
    // validated
    const formData = {
      email: req.body.email,
      name: req.body.name,
      google_id: req.body.google_user_id,
      contact: req.body.contact,
    };

    const authService = new AuthService();
    const customerService = new CustomerService();
    const t = await sequelize.transaction();
    try {
      // cross-check with provider
      const googleProfile = await authService.fetchGoogleAccessTokenInfo(req.body.token);
      if (googleProfile.sub !== formData.google_id) {
        throw new ValidationFailed('Mismatch Google profile.');
      }
      // force use Google email
      formData.email = googleProfile.email;

      const result = await customerService.create(formData, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new UserResource(result),
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }
}

module.exports = AuthController;
