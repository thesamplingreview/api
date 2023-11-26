const ApiController = require('../ApiController');
const allOptions = require('../../../config/options');
const {
  sequelize,
  User,
  UserRole,
  Vendor,
} = require('../../models');
const UserService = require('../../services/UserService');
const UserResource = require('../../resources/UserResource');

class UserController extends ApiController {
  constructor() {
    super();

    this.userService = new UserService();
  }

  /**
   * GET - all
   */
  async getAll(req, res) {
    try {
      const query = {
        where: await this.userService.genWhereQuery(req),
        include: [UserRole, Vendor],
      };
      const { page, perPage } = this.getPaginate(req);
      const results = await this.userService.paginate(query, page, perPage);

      return this.responsePaginate(req, res, {
        data: UserResource.collection(results.data),
        // data: results.data,
        meta: results.meta,
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * GET - single
   */
  async getSingle(req, res) {
    try {
      const record = await this.userService.findById(req.params.id, {
        include: [UserRole, Vendor],
      });

      return this.responseJson(req, res, {
        data: new UserResource(record),
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * POST - create
   */
  async create(req, res) {
    // validated
    const formData = {
      email: req.body.email,
      password: req.body.password,
      contact: req.body.contact,
      name: req.body.name,
      vendor_id: req.body.vendor_id,
      status: req.body.status,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const result = await this.userService.create(formData, { transaction: t });

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
   * PUT - update
   */
  async update(req, res) {
    // validated
    const formData = {
      password: req.body.password,
      contact: req.body.contact,
      name: req.body.name,
      status: req.body.status,
      role_id: req.body.role_id,
      vendor_id: req.body.vendor_id,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.userService.findById(req.params.id);
      const updated = await this.userService.update(record, formData, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new UserResource(updated),
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }

  /**
   * DELETE - remove
   */
  async remove(req, res) {
    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.userService.findById(req.params.id);
      const deleted = await this.userService.delete(record, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new UserResource(deleted),
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }

  /**
   * GET - options
   */
  async options(req, res) {
    const roles = await UserRole.scope('users').findAll({
      attributes: ['id', 'name'],
    });
    const vendors = await Vendor.findAll({
      attributes: ['id', 'name'],
    });

    const options = {
      roles,
      vendors,
      statuses: Object.values(User.STATUSES).map((val) => ({
        id: val,
        name: val.charAt(0).toUpperCase() + val.slice(1),
      })),
      phone_prefixes: allOptions.phonePrefixes,
    };

    return this.responseJson(req, res, {
      data: options,
    });
  }
}

module.exports = UserController;
