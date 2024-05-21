const { Sequelize } = require('sequelize');
const ApiController = require('../ApiController');
const { sequelize, User, UserRole } = require('../../models');
const VendorService = require('../../services/VendorService');
const AdminService = require('../../services/AdminService');
const VendorResource = require('../../resources/VendorResource');

class VendorController extends ApiController {
  constructor() {
    super();

    this.vendorService = new VendorService();
  }

  /**
   * GET - all
   */
  async getAll(req, res) {
    try {
      const query = {
        where: this.vendorService.genWhereQuery(req),
        include: [
          { model: User },
        ],
        attributes: {
          include: [
            [Sequelize.literal('(SELECT COUNT(*) FROM `users` AS `Users` WHERE `Users`.`vendor_id` = `Vendor`.`id`)'), 'adminsCount'],
          ],
        },
        distinct: true,
      };
      // const results = await this.vendorService.findAll(query);
      const { page, perPage } = this.getPaginate(req);
      const results = await this.vendorService.paginate(query, page, perPage);

      return this.responsePaginate(req, res, {
        data: VendorResource.collection(results.data),
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
      const record = await this.vendorService.findById(req.params.id, {
        attributes: {
          include: [
            [Sequelize.literal('(SELECT COUNT(*) FROM `users` AS `Users` WHERE `Users`.`vendor_id` = `Vendor`.`id`)'), 'adminsCount'],
          ],
        },
      });

      return this.responseJson(req, res, {
        data: new VendorResource(record),
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
      name: req.body.name,
      profile: req.body.profile,
      logo: req.body.logo,
      admin_name: req.body.admin_name,
      admin_email: req.body.admin_email,
      admin_password: req.body.admin_password,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const result = await this.vendorService.create(formData, { transaction: t });

      // create vendor admin
      const vendorRole = await UserRole.findOne({
        where: { group: UserRole.GROUPS.VENDOR },
        raw: true,
      });
      const adminService = new AdminService();
      await adminService.create({
        name: formData.admin_name,
        email: formData.admin_email,
        password: formData.admin_password,
        role_id: vendorRole.id,
        vendor_id: result.id,
      }, { transaction: t });

      await t.commit();

      // force refersh result
      await result.reload({
        include: [
          { model: User },
        ],
      });

      return this.responseJson(req, res, {
        data: new VendorResource(result),
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
      name: req.body.name,
      profile: req.body.profile,
      logo: req.body.logo,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.vendorService.findById(req.params.id);
      const updated = await this.vendorService.update(record, formData, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new VendorResource(updated),
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
      const record = await this.vendorService.findById(req.params.id);
      const deleted = await this.vendorService.delete(record, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new VendorResource(deleted),
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
    const options = {
      // ...silence is gold
    };

    return this.responseJson(req, res, {
      data: options,
    });
  }
}

module.exports = VendorController;
