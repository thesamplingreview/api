const ApiController = require('../ApiController');
const {
  Campaign, Product, Form, FormField, Vendor, CampaignEnrolment,
} = require('../../models');
const CampaignService = require('../../services/CampaignService');
const CampaignResource = require('../../resources/CampaignResource');

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
      const query = {
        where: {
          status: Campaign.STATUSES.PUBLISH,
        },
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
}

module.exports = CampaignController;
