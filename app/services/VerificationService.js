const { Op } = require('sequelize');
const BaseService = require('./BaseService');
const config = require('../../config/app');
const { VerificationToken } = require('../models');
const { consoleLog } = require('../helpers/logger');
const { sendSMS } = require('../helpers/sms');
const { sendWhatsAppCode } = require('../helpers/whatsapp');
const { sendMail } = require('../helpers/mailer');

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
    // Verify token from database (no bypass codes - using proper Evolution API tokens)
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
   * Create OTP token
   *
   * @param  {object}  input
   * @return {object}
   */
  async createOtpToken({ contact, type = VerificationToken.TYPES.PHONE }) {
    // Always generate proper random token (no bypass for production)
    // For WhatsApp via Evolution API, always use real tokens
    const code = this.randomToken();
    const expiry = Math.floor(Date.now() / 1000) + (60 * 60 * 2);

    let token = await this.model.findOne({
      where: { token_value: contact },
    });
    if (!token) {
      token = new VerificationToken({
        type,
        token_value: contact,
      });
    }
    token.type = type;
    token.token = code;
    token.created_at = new Date();
    token.expired_at = new Date(expiry * 1000);
    const result = await token.save();

    return result;
  }

  /**
   * Send out OTP
   *
   * @param  {object}  input
   * @return {object}
   */
  async sendOtp(input) {
    const token = await this.createOtpToken({
      contact: input.contact,
    });

    // debug log
    consoleLog(`Preparing send OTP to ${input.contact}...`);

    // send OTP through SMS (production only)
    if (config.env === 'production') {
      await sendSMS({
        to: input.contact,
        message: `Your [SamplingReview] verification code is: ${token.token}`,
      });
    }

    consoleLog(`Finish send OTP to ${input.contact}...`);

    return token;
  }

  /**
   * Send out OTP using WhatsApp authentication (via Evolution API)
   *
   * @param  {object}  input
   * @return {object}
   */
  async sendOtpWa(input) {
    // Always generate proper random token (no bypass)
    const token = await this.createOtpToken({
      contact: input.contact,
    });

    // debug log
    consoleLog(`Preparing send WA OTP to ${input.contact}...`);

    // send OTP through Evolution API (always send, not just production)
    await sendWhatsAppCode({
      to: input.contact,
      templateName: 'test_code',
      code: token.token,
      throwErr: true,
    });

    consoleLog(`Finish send WA OTP to ${input.contact}...`);

    return token;
  }

  /**
   * Send out OTP using Email authentication
   *
   * @param  {object}  input
   * @return {object}
   */
  async sendOtpEmail(input) {
    const token = await this.createOtpToken({
      contact: input.email,
      type: VerificationToken.TYPES.EMAIL,
    });

    // debug log
    consoleLog(`Preparing send Email OTP to ${input.email}...`);

    // send OTP through Email (production only)
    if (config.env === 'production') {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification Code</h2>
          <p>Your [SamplingReview] verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${token.token}
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 2 hours.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `;
      
      await sendMail({
        to: input.email,
        subject: '[SamplingReview] Email Verification Code',
        content: emailContent,
        useHtml: true,
        throwErr: true,
      });
    }

    consoleLog(`Finish send Email OTP to ${input.email}...`);

    return token;
  }
}

module.exports = VerificationService;
