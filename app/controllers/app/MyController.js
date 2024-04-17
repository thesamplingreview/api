const ApiController = require('../ApiController');
const {
  Campaign, Vendor, CampaignEnrolment, CampaignReview,
} = require('../../models');
const CampaignService = require('../../services/CampaignService');
const CampaignResource = require('../../resources/CampaignResource');

class MyController extends ApiController {
  /**
   * GET - all
   */
  async getCampaigns(req, res) {
    try {
      const campaignService = new CampaignService();

      const query = {
        where: {
          status: Campaign.STATUSES.PUBLISH,
        },
        order: campaignService.genOrdering(req),
        include: [
          { model: Vendor },
          {
            model: CampaignEnrolment,
            where: { user_id: req.user.id },
          },
          {
            model: CampaignReview,
            where: { created_by: req.user.id },
            required: false,
          },
        ],
      };
      const { page, perPage } = this.getPaginate(req);
      const results = await campaignService.paginate(query, page, perPage);

      // @fix: paginate() not support for include.where conditions
      const count = await campaignService.count(query);
      results.meta.total = count;

      return this.responsePaginate(req, res, {
        data: CampaignResource.collection(results.data),
        meta: results.meta,
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }
}

module.exports = MyController;
