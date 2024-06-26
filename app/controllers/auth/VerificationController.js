const ApiController = require('../ApiController');
const VerificationService = require('../../services/VerificationService');
const { sequelize } = require('../../models');
const { debug } = require('../../../config/app');

class VerificationController extends ApiController {
  constructor() {
    super();

    this.verificationService = new VerificationService();
  }

  /**
   * POST - request otp SMS
   */
  async requestSMSOtp(req, res) {
    const formData = {
      contact: req.body.contact,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const result = await this.verificationService.sendOtp(formData);
      await t.commit();

      return this.responseJson(req, res, {
        message: 'ok',
        data: debug ? result : null,
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }

  /**
   * POST - request otp using WhatsApp
   */
  async requestWAOtp(req, res) {
    const formData = {
      contact: req.body.contact,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const result = await this.verificationService.sendOtpWa(formData);
      await t.commit();

      return this.responseJson(req, res, {
        message: 'ok',
        data: debug ? result : null,
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }
}

module.exports = VerificationController;
