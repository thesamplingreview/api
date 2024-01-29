const bcrypt = require('bcryptjs');
const ApiController = require('../ApiController');
const { genValidatorItem } = require('../../helpers/validator');
// const { verifyOTP } = require('../../helpers/sms');
const { ValidationFailed } = require('../../errors');
const { sequelize, VerificationToken } = require('../../models');
const UserService = require('../../services/UserService');
const VerificationService = require('../../services/VerificationService');
const UserResource = require('../../resources/UserResource');

class MyController extends ApiController {
  constructor() {
    super();

    this.userService = new UserService();
  }

  /**
   * GET - my
   */
  async my(req, res) {
    try {
      const user = await this.userService.findById(req.user.id);

      return this.responseJson(req, res, {
        data: new UserResource(user),
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * PUT - update
   */
  async update(req, res) {
    // validated
    const formData = {
      name: req.body.name,
      password: req.body.password,
      contact: req.body.contact,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.userService.findById(req.user.id);
      const result = await this.userService.update(record, formData, { transaction: t });

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
   * PUT - change password
   */
  async changePassword(req, res) {
    // validated
    const formData = {
      password: req.body.new_password,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const user = await this.userService.findById(req.user.id);
      const isPasswordValid = bcrypt.compareSync(req.body.old_password, user.password);
      if (!isPasswordValid) {
        throw new ValidationFailed(undefined, [
          genValidatorItem('Old password not match', 'old_password'),
        ]);
      }

      const result = await this.userService.update(user, formData, { transaction: t });

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
   * PUT - change contact
   */
  async changeContact(req, res) {
    // DB update
    const t = await sequelize.transaction();
    try {
      const user = await this.userService.findById(req.user.id);

      const verificationService = new VerificationService();
      const token = await verificationService.verifyToken(
        VerificationToken.TYPES.PHONE,
        req.body.contact,
        req.body.code,
      );
      // const token = await verifyOTP({
      //   to: req.body.contact,
      //   code: req.body.code,
      // });
      if (!token) {
        throw new ValidationFailed(undefined, [
          genValidatorItem('Code not matched.', 'Code'),
        ]);
      }

      // update contact
      user.contact = req.body.contact;
      user.contact_verified_at = new Date();
      await user.save({ transaction: t });

      // remove token also
      // await verificationService.delete(token, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new UserResource(user),
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }
}

module.exports = MyController;
