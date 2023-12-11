const ApiController = require('../ApiController');
const { sequelize } = require('../../models');
const UserService = require('../../services/UserService');
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
}

module.exports = MyController;
