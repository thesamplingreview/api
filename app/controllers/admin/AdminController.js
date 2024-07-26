const { Op } = require('sequelize');
const ApiController = require('../ApiController');
const {
  sequelize,
  User,
  UserRole,
  Vendor,
} = require('../../models');
const AdminService = require('../../services/AdminService');
const UserResource = require('../../resources/UserResource');
const { ValidationFailed } = require('../../errors');

class UserController extends ApiController {
  constructor() {
    super();

    this.adminService = new AdminService('admins');
  }

  /**
   * GET - all
   */
  async getAll(req, res) {
    try {
      const query = {
        where: this.adminService.genWhereQuery(req),
        order: this.adminService.genOrdering(req),
        include: [UserRole, Vendor],
      };
      const { page, perPage } = this.getPaginate(req);
      const results = await this.adminService.paginate(query, page, perPage);

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
      vendor_id: req.role.group === UserRole.GROUPS.VENDOR ? req.body.vendor_id : null,
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
      vendor_id: req.role.group === UserRole.GROUPS.VENDOR ? req.body.vendor_id : null,
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

  /**
   * GET - options
   */
  async options(req, res) {
    const roles = await UserRole.findAll({
      attributes: ['id', 'name', 'group'],
      where: {
        id: { [Op.ne]: 9 },
        group: { [Op.ne]: UserRole.GROUPS.USER },
      },
    });

    const options = {
      roles,
      statuses: Object.values(User.STATUSES).map((val) => ({
        id: val,
        name: val.charAt(0).toUpperCase() + val.slice(1),
      })),
    };

    return this.responseJson(req, res, {
      data: options,
    });
  }
}

module.exports = UserController;
