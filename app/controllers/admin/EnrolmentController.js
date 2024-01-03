const ApiController = require('../ApiController');
const {
  sequelize, CampaignEnrolment, Campaign, Form, FormField, User, Product,
} = require('../../models');
const EnrolmentService = require('../../services/EnrolmentService');
const CampaignEnrolmentResource = require('../../resources/CampaignEnrolmentResource');

class EnrolmentController extends ApiController {
  constructor() {
    super();

    this.enrolmentService = new EnrolmentService();
  }

  /**
   * GET - all
   */
  async getAll(req, res) {
    try {
      const query = {
        where: this.enrolmentService.genWhereQuery(req),
        order: this.enrolmentService.genOrdering(req),
        include: [
          { model: Campaign },
          { model: User },
          { model: Form, include: [FormField] },
        ],
      };
      const { page, perPage } = this.getPaginate(req);
      const results = await this.enrolmentService.paginate(query, page, perPage);

      return this.responsePaginate(req, res, {
        data: CampaignEnrolmentResource.collection(results.data),
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
      const record = await this.enrolmentService.findById(req.params.id, {
        include: [
          { model: Campaign, include: [Product] },
          { model: User },
          { model: Form, include: [FormField] },
        ],
      });

      return this.responseJson(req, res, {
        data: new CampaignEnrolmentResource(record),
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * PUT - admin setting
   */
  async update(req, res) {
    // validated
    const formData = {
      status: req.body.status,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.enrolmentService.findById(req.params.id);
      const updated = await this.enrolmentService.update(record, formData, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new CampaignEnrolmentResource(updated),
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
      const record = await this.enrolmentService.findById(req.params.id);
      const deleted = await this.enrolmentService.delete(record, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new CampaignEnrolmentResource(deleted),
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
    const campaigns = await Campaign.findAll({
      attributes: ['id', 'name'],
    });
    const options = {
      campaigns,
      statuses: Object.values(CampaignEnrolment.STATUSES).map((val) => ({
        id: val,
        name: val.charAt(0).toUpperCase() + val.slice(1),
      })),
    };

    return this.responseJson(req, res, {
      data: options,
    });
  }
}

module.exports = EnrolmentController;
