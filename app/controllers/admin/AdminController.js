const ApiController = require('../ApiController');
const {
  sequelize,
  UserRole,
} = require('../../models');
const AdminService = require('../../services/AdminService');
const UserResource = require('../../resources/UserResource');
const { ValidationFailed } = require('../../errors');

class UserController extends ApiController {
  constructor() {
    super();

    this.adminService = new AdminService();
  }

  /**
   * GET - all
   */
  async getAll(req, res) {
    try {
      const query = {
        where: await this.adminService.genWhereQuery(req),
        include: [UserRole],
      };
      const results = await this.adminService.paginate(query, 1, 10);

      return this.responsePaginate(req, res, {
        data: UserResource.collection(results.data),
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
      const record = await this.adminService.findById(req.params.id, {
        include: [UserRole],
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
      name: req.body.name,
      contact: req.body.contact,
      role_id: req.body.role_id,
      status: req.body.status,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const result = await this.adminService.create(formData, { transaction: t });

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
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.adminService.findById(req.params.id);
      const updated = await this.adminService.update(record, formData, { transaction: t });

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
  async remove(req, res, next) {
    // validation - own record deletion
    if (req.params.id === req.user.id) {
      return next(new ValidationFailed('You can not delete own account'));
    }

    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.adminService.findById(req.params.id);
      const deleted = await this.adminService.delete(record, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new UserResource(deleted),
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }
}

module.exports = UserController;
