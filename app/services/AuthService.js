const bcrypt = require('bcryptjs');
const { ValidationFailed } = require('../errors');
const JWTService = require('./JWTService');
const CustomerService = require('./CustomerService');
const { User, UserRole } = require('../models');

class AuthService {
  constructor() {
    this.jwtService = new JWTService();
  }

  /**
   * Login and return JWT tokens
   *
   * @param  {object}  input
   * @return {object}
   */
  async loginWithPassword(input) {
    const formData = {
      email: input.email || '',
      password: input.password || '',
    };

    // validation
    const user = await User.findOne({
      where: {
        email: formData.email,
      },
    });
    if (!user) {
      throw new ValidationFailed('Invalid email');
    }
    const isPasswordValid = bcrypt.compareSync(formData.password, user.password);
    if (!isPasswordValid) {
      throw new ValidationFailed('Invalid password');
    }

    // generate auth token
    const tokens = await this.jwtService.generateAuthToken(user);

    return { user, tokens };
  }

  /**
   * Login using Google and return JWT tokens
   *
   * @param  {object}  input
   * @param  {object}  options (transaction, etc)
   * @return {object}
   */
  async loginWithGoogle(input, options = {}) {
    // cross-check with provider
    const googleProfile = await this.fetchGoogleAccessTokenInfo(input.token);
    // re-verify input email is same as googleProfile
    if (input.email !== googleProfile.email) {
      throw new ValidationFailed('Mismatch Google email.');
    }

    let isCreated = false;
    let user = await User.findOne({
      where: {
        email: input.email,
      },
    });
    // create user if model not found
    if (!user) {
      const customerService = new CustomerService();
      const newFormData = {
        email: googleProfile.email,
        name: googleProfile.name,
        google_id: googleProfile.sub,
      };
      user = await customerService.create(newFormData, options);
      isCreated = true;
    }

    // re-verify if user is same as googleProfile
    if (user.google_id !== googleProfile.sub) {
      throw new ValidationFailed('Mismatch Google profile.');
    }

    // generate auth token
    const tokens = await this.jwtService.generateAuthToken(user);

    return { user, tokens, isCreated };
  }

  /**
   * Check user role group
   *
   * @param  {string}  userId
   * @param  {string}  roleGroup
   * @return {model|null}
   */
  async checkUserRoleGroup(userId, roleGroup) {
    const user = await User.findOne({
      where: { id: userId },
      include: [UserRole],
    });
    if (user?.UserRole?.group === roleGroup) {
      return user;
    }
    return null;
  }

  /**
   * Get Google accessToken info
   *
   * @param  {string}  accessToken
   * @return {object|Error}
   */
  async fetchGoogleAccessTokenInfo(accessToken) {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
    const result = await response.json();
    if (!result.sub) {
      throw new ValidationFailed('Google OAuth2.0 failed.');
    }
    return result;
  }
}

module.exports = AuthService;
