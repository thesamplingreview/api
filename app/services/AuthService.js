const bcrypt = require('bcryptjs');
const { ValidationFailed } = require('../errors');
const UserService = require('./UserService');
const JWTService = require('./JWTService');

class AuthService {
  constructor() {
    this.userService = new UserService();
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
    const user = await this.userService.findOne({
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
}

module.exports = AuthService;
