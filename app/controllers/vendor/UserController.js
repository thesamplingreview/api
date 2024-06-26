const { Sequelize } = require('sequelize');
const ApiController = require('../ApiController');
const allOptions = require('../../../config/options');
const {
  User,
  UserRole,
  Campaign,
} = require('../../models');
const CustomerService = require('../../services/CustomerService');
const UserResource = require('../../resources/UserResource');

class UserController extends ApiController {
  constructor() {
    super();

    this.customerService = new CustomerService();
  }

  /**
   * GET - all
   */
  async getAll(req, res) {
    // inject vendor-only filter
    // req.query.vendor_id = req.user.vendor_id;
    // *using include.where due to m2m relationship

    try {
      const query = {
        where: this.customerService.genWhereQuery(req),
        order: this.customerService.genOrdering(req),
        include: [
          {
            model: Campaign,
            required: true,
            where: {
              vendor_id: req.user.vendor_id,
            },
          },
        ],
      };
      const { page, perPage } = this.getPaginate(req);
      const results = await this.customerService.paginate(query, page, perPage);

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
      const record = await this.customerService.findOne({
        where: {
          id: req.params.id,
        },
        include: [
          { model: UserRole },
          {
            model: Campaign,
            where: {
              vendor_id: req.user.vendor_id,
            },
          },
        ],
        attributes: {
          include: [
            [Sequelize.literal('(SELECT COUNT(*) FROM `campaign_enrolments` AS `CampaignEnrolments` WHERE `CampaignEnrolments`.`user_id` = `User`.`id`)'), 'enrolmentsCount'],
          ],
        },
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
   *
   * vendor are unable to create user
   */

  /**
   * PUT - update
   *
   * vendor are unable to update user
   */

  /**
   * DELETE - remove
   *
   * vendor are unable to delete user
   */

  /**
   * GET - options
   */
  async options(req, res) {
    const roles = await UserRole.scope('users').findAll({
      attributes: ['id', 'name'],
    });

    const options = {
      roles,
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
