const { Sequelize } = require('sequelize');
const ApiController = require('../ApiController');
const { sequelize, User } = require('../../models');
const VendorService = require('../../services/VendorService');
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
        where: await this.vendorService.genWhereQuery(req),
        include: [
          { model: User },
        ],
        attributes: {
          include: [
            // NOTE: these only works on findAll
            // [Sequelize.fn('COUNT', Sequelize.col('Users.id')), 'count_users'],
            [Sequelize.literal('(SELECT COUNT(*) FROM `users` AS `Users` WHERE `Users`.`vendor_id` = `Vendor`.`id`)'), 'usersCount'],
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
      const record = await this.vendorService.findById(req.params.id);

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
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const result = await this.vendorService.create(formData, { transaction: t });

      await t.commit();
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
