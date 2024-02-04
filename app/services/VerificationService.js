const { Op } = require('sequelize');
const BaseService = require('./BaseService');
const config = require('../../config/app');
const { VerificationToken } = require('../models');
const { sendSMS } = require('../helpers/sms');

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
    const characters = '0123456789';
    for (let i = 0; i < length; i += 1) {
      const index = Math.floor(Math.random() * characters.length);
      otp += characters.charAt(index);
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
    const code = config.env === 'production' ? this.randomToken() : '888888';
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
    const result = await token.save();

    // send OTP through SMS (production only)
    if (config.env === 'production') {
      await sendSMS({
        to: input.contact,
        message: `Your [SamplingReview] verification code is: ${code}`,
      });
    }

    return result;
  }
}

module.exports = VerificationService;
