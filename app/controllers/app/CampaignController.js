const ApiController = require('../ApiController');
const {
  sequelize, Campaign, Product, Form, FormField, Vendor, CampaignEnrolment,
} = require('../../models');
const CampaignService = require('../../services/CampaignService');
const CampaignResource = require('../../resources/CampaignResource');
const CampaignEnrolmentResource = require('../../resources/CampaignEnrolmentResource');

class CampaignController extends ApiController {
  constructor() {
    super();

    this.campaignService = new CampaignService();
  }

  /**
   * GET - all
   */
  async getAll(req, res) {
    try {
      // force published only
      req.query.status = Campaign.STATUSES.PUBLISH;
      const query = {
        where: await this.campaignService.genWhereQuery(req),
        order: await this.campaignService.genOrdering(req),
        include: [
          { model: Vendor },
          req.user?.id ? {
            model: CampaignEnrolment,
            required: false,
            where: { user_id: req.user.id },
          } : undefined,
        ].filter((d) => d),
      };
      const { page, perPage } = this.getPaginate(req);
      const results = await this.campaignService.paginate(query, page, perPage);

      return this.responsePaginate(req, res, {
        data: CampaignResource.collection(results.data),
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
      const record = await this.campaignService.findOne({
        where: {
          slug: req.params.slug,
          status: Campaign.STATUSES.PUBLISH,
        },
        include: [
          { model: Vendor },
          {
            model: Form,
            include: [FormField],
          },
          { model: Product },
          req.user?.id ? {
            model: CampaignEnrolment,
            required: false,
            where: { user_id: req.user.id },
          } : undefined,
        ].filter((d) => d),
      });

      return this.responseJson(req, res, {
        data: new CampaignResource(record),
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * Create enrolment
   */
  async createEnrolment(req, res) {
    // validated
    const formData = {
      user_id: req.user.id,
      campaign_id: req.body.campaign_id,
      form_id: req.body.form_id,
      submissions: req.body.submissions,
    };
    // DB update
    const t = await sequelize.transaction();
    try {
      const result = await this.campaignService.createCampaignEnrolment(formData, { transaction: t });

      t.commit();
      return this.responseJson(req, res, {
        data: new CampaignEnrolmentResource(result),
      });
    } catch (err) {
      t.rollback();
      return this.responseError(req, res, err);
    }
  }
}

module.exports = CampaignController;
