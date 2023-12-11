const crypto = require('crypto');
const ApiController = require('../ApiController');
const { sequelize, AuthToken, PasswordReset } = require('../../models');
const UserService = require('../../services/UserService');
const { ValidationFailed } = require('../../errors');

class PasswordController extends ApiController {
  /**
   * POST - generate reset token
   */
  async resetToken(req, res) {
    try {
      let reset = await PasswordReset.findOne({
        where: { email: req.body.email },
      });
      if (!reset) {
        reset = new PasswordReset({
          email: req.body.email,
        });
      }
      reset.token = crypto.randomBytes(Math.ceil(18))
        .toString('hex')
        .slice(0, 36);
      reset = await reset.save();

      return this.responseJson(req, res, {
        data: reset,
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * POST - reset password
   */
  async resetPassword(req, res, next) {
    const { reset } = req;
    if (reset.email !== req.body.email) {
      return next(new ValidationFailed('Email not matched with token.'));
    }

    const formData = {
      password: req.body.password,
    };

    // DB update
    const userService = new UserService();
    const t = await sequelize.transaction();
    try {
      const user = await userService.findOne({
        where: { email: reset.email },
      });
      await userService.update(user, formData, { transaction: t });
      await reset.destroy({ transaction: t });
      // revoke all auth token
      await AuthToken.destroy({
        where: { user_id: user.id },
        transaction: t,
      });
      await t.commit();

      return this.responseJson(req, res, {
        data: { reset: 'done' },
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }
}

module.exports = PasswordController;
