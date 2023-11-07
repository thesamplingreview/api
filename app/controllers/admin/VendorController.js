const { Sequelize } = require('sequelize');
const ApiController = require('../ApiController');
const { User } = require('../../models');
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
            [Sequelize.literal('(SELECT COUNT(*) FROM `users` AS `Users` WHERE `Users`.`vendor_id` = `Vendor`.`id`)'), 'users_count'],
          ],
        },
        distinct: true,
      };
      // const results = await this.vendorService.findAll(query);
      const results = await this.vendorService.paginate(query, 1, 10);

      return this.responsePaginate(req, res, {
        // data: VendorResource.collection(results.data),
        data: results.data,
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
      const record = await this.vendorService.findbyId(req.params.id);

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
    try {
      const result = await this.vendorService.create(formData);

      return this.responseJson(req, res, {
        data: new VendorResource(result),
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
      profile: req.body.profile,
      logo: req.body.logo,
    };

    try {
      const record = await this.vendorService.findbyId(req.params.id);
      const updated = await this.vendorService.update(record, formData);

      return this.responseJson(req, res, {
        data: new VendorResource(updated),
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * DELETE - remove
   */
  async remove(req, res) {
    try {
      const record = await this.vendorService.findbyId(req.params.id);
      const deleted = await this.vendorService.delete(record);

      return this.responseJson(req, res, {
        data: new VendorResource(deleted),
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }
}

module.exports = VendorController;
