const bcrypt = require('bcryptjs');
const { ValidationFailed, ModelNotFound } = require('../errors');
const JWTService = require('./JWTService');
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
   * Get user info
   *
   * @param  {string}  userId
   * @return {model|null}
   */
  async getUser(userId, options = {}) {
    const user = await User.findByPk(userId, options);
    if (!user) {
      throw new ModelNotFound();
    }

    return user;
  }
}

module.exports = AuthService;
