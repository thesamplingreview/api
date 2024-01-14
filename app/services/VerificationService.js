const { Op } = require('sequelize');
const BaseService = require('./BaseService');
const config = require('../../config/app');
const { VerificationToken } = require('../models');

class VerificationService extends BaseService {
  constructor() {
    super(VerificationToken);
  }

  /**
   * Generator random string
   *
   * @return {string}
   */
  randomToken(length = 6) {
    let otp = '';
    // force default token on dev environment
    if (config.env !== 'production') {
      for (let i = 0; i < length; i += 1) {
        otp += '8';
      }
    } else {
      const characters = '0123456789';
      for (let i = 0; i < length; i += 1) {
        const index = Math.floor(Math.random() * characters.length);
        otp += characters.charAt(index);
      }
    }
    return otp;
  }

  /**
   * Verify token
   *
   * @param  {string}  type
   * @param  {string}  type
   * @param  {string}  type
   * @return {boolean}
   */
  async verifyToken(type, value, token) {
    const found = await this.model.findOne({
      where: {
        type,
        token,
        token_value: value,
        expired_at: {
          [Op.gte]: new Date(),
        },
      },
    });
    return found;
  }

  /**
   * Send out OTP
   *
   * @param  {object}  input
   * @return {object}
   */
  async sendOtp(input) {
    const code = this.randomToken();
    const expiry = Math.floor(Date.now() / 1000) + (60 * 60 * 2);

    let token = await this.model.findOne({
      where: { token_value: input.contact },
    });
    if (!token) {
      token = new VerificationToken({
        token_value: input.contact,
        type: VerificationToken.TYPES.PHONE,
      });
    }
    token.token = code;
    token.created_at = new Date();
    token.expired_at = new Date(expiry * 1000);

    // send OTP using?

    const result = await token.save();
    return result;
  }
}

module.exports = VerificationService;
