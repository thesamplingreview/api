const ApiController = require('../ApiController');
const { ValidationFailed } = require('../../errors');
const {
  sequelize, Campaign, Product, Form, FormField, FormFieldOption, Vendor, CampaignEnrolment, CampaignReview,
} = require('../../models');
const CampaignService = require('../../services/CampaignService');
const EnrolmentService = require('../../services/EnrolmentService');
const ReviewService = require('../../services/ReviewService');
const CampaignResource = require('../../resources/CampaignResource');
const CampaignEnrolmentResource = require('../../resources/CampaignEnrolmentResource');
const CampaignReviewResource = require('../../resources/CampaignReviewResource');

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
        where: this.campaignService.genWhereQuery(req),
        order: this.campaignService.genOrdering(req),
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
            include: [
              { model: FormField, include: [FormFieldOption] },
            ],
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
      campaign_id: req.campaign.id,
      form_id: req.body.form_id,
      submissions: req.body.submissions,
    };

    const enrolmentService = new EnrolmentService();

    const t = await sequelize.transaction();
    try {
      // DB validation - if user have enrolment record
      const enrolment = await CampaignEnrolment.findOne({
        where: {
          campaign_id: formData.campaign_id,
          user_id: formData.user_id,
        },
      });
      if (enrolment) {
        throw new ValidationFailed('User already enroled.');
      }

      // DB update
      const result = await enrolmentService.create(formData, { transaction: t });

      t.commit();
      return this.responseJson(req, res, {
        data: new CampaignEnrolmentResource(result),
      });
    } catch (err) {
      t.rollback();
      return this.responseError(req, res, err);
    }
  }

  /**
   * Create review
   */
  async createReview(req, res) {
    // validated
    const formData = {
      created_by: req.user.id,
      campaign_id: req.campaign.id,
      rating: req.body.rating,
      review: req.body.review,
    };

    const reviewService = new ReviewService();

    const t = await sequelize.transaction();
    try {
      // DB validation - if user dont have enrolment record
      const enrolment = await CampaignEnrolment.findOne({
        where: {
          campaign_id: formData.campaign_id,
          user_id: formData.created_by,
        },
      });
      if (!enrolment) {
        throw new ValidationFailed('User do not have any enrolment on this campaign.');
      }

      // DB validation - if user have review record
      const hasReview = await CampaignReview.findOne({
        where: {
          campaign_id: formData.campaign_id,
          created_by: formData.created_by,
        },
      });
      if (hasReview) {
        throw new ValidationFailed('User already review this campaign.');
      }

      // DB update
      const result = await reviewService.create(formData, { transaction: t });

      t.commit();
      return this.responseJson(req, res, {
        data: new CampaignReviewResource(result),
      });
    } catch (err) {
      t.rollback();
      return this.responseError(req, res, err);
    }
  }
}

module.exports = CampaignController;
