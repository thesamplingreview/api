const { Op } = require('sequelize');
const ApiController = require('../ApiController');
const { ValidationFailed } = require('../../errors');
const {
  sequelize, Campaign, Product, Form, FormField, FormFieldOption, Vendor, CampaignEnrolment, CampaignReview,
} = require('../../models');
const CampaignService = require('../../services/CampaignService');
const EnrolmentService = require('../../services/EnrolmentService');
const ReviewService = require('../../services/ReviewService');
const WorkflowService = require('../../services/WorkflowService');
// const ConfigService = require('../../services/ConfigService');
const CampaignResource = require('../../resources/CampaignResource');
const CampaignEnrolmentResource = require('../../resources/CampaignEnrolmentResource');
const CampaignReviewResource = require('../../resources/CampaignReviewResource');
// const { sendMailUsingTmpl } = require('../../helpers/mailer');

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
        attributes: {
          include: [
            // [sequelize.literal('(SELECT COUNT(*) FROM `campaign_enrolments` AS `CampaignEnrolments` WHERE `CampaignEnrolments`.`campaign_id` = `Campaign`.`id`)'), 'enrolmentsCount'],
            [sequelize.literal('(SELECT COUNT(*) FROM `campaign_enrolments` AS `CampaignEnrolments` WHERE `CampaignEnrolments`.`campaign_id` = `Campaign`.`id` AND (`CampaignEnrolments`.`status` <> "reject" OR `CampaignEnrolments`.`status` IS NULL))'), 'enrolmentsAcceptedCount'],
          ],
        },
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
    const workflowService = new WorkflowService();
    // eslint-disable-next-line prefer-destructuring
    const campaign = req.campaign;

    const t = await sequelize.transaction();
    try {
      // DB validation - enrolment quota
      if (campaign.quota) {
        const count = await enrolmentService.count({
          where: {
            campaign_id: formData.campaign_id,
            status: {
              [Op.or]: [
                { [Op.ne]: CampaignEnrolment.STATUSES.REJECT },
                { [Op.is]: null },
              ],
            },
          },
        });
        if (count >= campaign.quota) {
          throw new ValidationFailed('quota limit hit', [{
            field: 'quota',
            msg: 'This campaign already reached maximum of enrolments.',
          }]);
        }
      }

      // DB validation - if user have enrolment record
      const enrolment = await CampaignEnrolment.findOne({
        where: {
          campaign_id: formData.campaign_id,
          user_id: formData.user_id,
        },
      });
      if (enrolment) {
        throw new ValidationFailed('invalid_enrolment', [{
          field: 'user_id',
          msg: 'User already enrolled previously.',
        }]);
      }

      // DB update
      const result = await enrolmentService.create(formData, { transaction: t });

      await t.commit();

      // trigger submission workflow
      await workflowService.triggerEnrolmentWorkflow(campaign.id, [result.id]);

      // Deprecated - replace with workflow tasks
      // email notifications
      // const configService = new ConfigService();
      // const {
      //   sendgrid_template_id_campaign_enrolled_user: tmplUser,
      //   sendgrid_template_id_campaign_enrolled_admin: tmplAdmin,
      //   admin_emails,
      // } = await configService.getKeys([
      //   'sendgrid_template_id_campaign_enrolled_user',
      //   'sendgrid_template_id_campaign_enrolled_admin',
      //   'admin_emails',
      // ]);
      // const tmplData = {
      //   enrolment_id: result.id,
      //   campaign_name: req.campaign.name,
      //   user_name: req.user.name,
      //   user_email: req.user.email,
      // };
      // if (tmplUser) {
      //   const formdata = {
      //     to: req.user.email,
      //     subject: 'Thank You for Interested in Sampling Programs',
      //     templateId: tmplUser,
      //     templateData: tmplData,
      //   };
      //   await sendMailUsingTmpl(formdata);
      // }
      // const adminEmails = admin_emails?.split('\n').map((d) => d.trim());
      // if (tmplAdmin && adminEmails?.length) {
      //   const formdata = {
      //     to: adminEmails,
      //     subject: 'New Enrolment',
      //     templateId: tmplAdmin,
      //     templateData: tmplData,
      //   };
      //   await sendMailUsingTmpl(formdata);
      // }

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

      await t.commit();
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
