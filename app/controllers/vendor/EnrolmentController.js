const ApiController = require('../ApiController');
const {
  sequelize, CampaignEnrolment, Campaign, Form, FormField, User, Product,
} = require('../../models');
const CampaignService = require('../../services/CampaignService');
const EnrolmentService = require('../../services/EnrolmentService');
const CampaignEnrolmentResource = require('../../resources/CampaignEnrolmentResource');
const EnrolmentCsv = require('../../exporters/EnrolmentCsv');

class EnrolmentController extends ApiController {
  constructor() {
    super();

    this.enrolmentService = new EnrolmentService();
  }

  /**
   * GET - all
   */
  async getAll(req, res) {
    // inject vendor-only filter
    req.query.vendor_id = req.user.vendor_id;

    try {
      const query = {
        where: this.enrolmentService.genWhereQuery(req),
        order: this.enrolmentService.genOrdering(req),
        include: [
          { model: Campaign, required: true },
          { model: User, required: true },
          { model: Form, include: [FormField] },
        ],
        countInclude: [
          { model: Campaign, required: true },
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
          {
            model: Campaign,
            where: {
              vendor_id: req.user.vendor_id,
            },
            include: [Product],
          },
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
      const record = await this.enrolmentService.findById(req.params.id, {
        include: [
          {
            model: Campaign,
            where: {
              vendor_id: req.user.vendor_id,
            },
          },
        ],
      });
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
      const record = await this.enrolmentService.findById(req.params.id, {
        include: [
          {
            model: Campaign,
            where: {
              vendor_id: req.user.vendor_id,
            },
          },
        ],
      });
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
      where: {
        vendor_id: req.user.vendor_id,
      },
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

  /**
   * GET - export (by campaign-basis only)
   */
  async export(req, res) {
    try {
      const campaignService = new CampaignService();
      const record = await campaignService.findOne({
        where: {
          id: req.query.campaign_id,
          vendor_id: req.user.vendor_id,
        },
        include: [
          { model: Form },
        ],
      });
      let fields = [];
      if (record.Form) {
        fields = await record.Form.getFormFields({
          raw: true,
        });
      }

      const enrolmentCsv = new EnrolmentCsv({
        filter: { campaign_id: record.id },
        formFields: fields,
      });
      const csv = await enrolmentCsv.toCsv();
      return this.responseCsv(req, res, csv);
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }
}

module.exports = EnrolmentController;
