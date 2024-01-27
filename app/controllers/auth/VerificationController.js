const ApiController = require('../ApiController');
// const VerificationService = require('../../services/VerificationService');
const { sequelize } = require('../../models');
const { sendOTP } = require('../../helpers/sms');
const { debug } = require('../../../config/app');

class VerificationController extends ApiController {
  constructor() {
    super();

    // this.verificationService = new VerificationService();
  }

  /**
   * POST - create phone otp
   */
  async createOtp(req, res) {
    const formData = {
      contact: req.body.contact,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const result = await sendOTP({
        to: formData.contact
      });
      // const result = await this.verificationService.sendOtp(formData);
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
