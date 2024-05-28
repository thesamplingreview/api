const { Sequelize } = require('sequelize');
const ApiController = require('../ApiController');
const { ValidationFailed } = require('../../errors');
const allOptions = require('../../../config/options');
const {
  sequelize, Campaign, Product, Form, Vendor, User, WorkflowTask,
} = require('../../models');
const CampaignService = require('../../services/CampaignService');
const WorkflowService = require('../../services/WorkflowService');
const CampaignResource = require('../../resources/CampaignResource');
const WorkflowResource = require('../../resources/WorkflowResource');

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
        where: this.campaignService.genWhereQuery(req),
        order: this.campaignService.genOrdering(req),
        include: [
          { model: Form },
          { model: Vendor },
        ],
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
      const record = await this.campaignService.findById(req.params.id, {
        include: [
          { model: Vendor },
          { model: Form },
          { model: Product },
          { model: User },
        ],
        attributes: {
          include: [
            // [Sequelize.literal('(SELECT COUNT(*) FROM `campaign_enrolments` AS `CampaignEnrolments` WHERE `CampaignEnrolments`.`campaign_id` = `Campaign`.`id`)'), 'enrolmentsCount'],
            [Sequelize.literal('(SELECT COUNT(*) FROM `campaign_enrolments` AS `CampaignEnrolments` WHERE `CampaignEnrolments`.`campaign_id` = `Campaign`.`id` AND (`CampaignEnrolments`.`status` <> "reject" OR `CampaignEnrolments`.`status` IS NULL))'), 'enrolmentsAcceptedCount'],
            [Sequelize.literal('(SELECT COUNT(*) FROM `campaign_reviews` AS `CampaignReviews` WHERE `CampaignReviews`.`campaign_id` = `Campaign`.`id`)'), 'reviewsCount'],
            [Sequelize.literal('(SELECT COUNT(*) FROM `campaign_products` AS `CampaignProducts` WHERE `CampaignProducts`.`campaign_id` = `Campaign`.`id`)'), 'productsCount'],
            [Sequelize.literal('(SELECT COUNT(*) FROM `campaign_workflows` AS `CampaignWorkflows` WHERE `CampaignWorkflows`.`campaign_id` = `Campaign`.`id`)'), 'workflowsCount'],
          ],
        },
        distinct: true,
      });

      return this.responseJson(req, res, {
        data: new CampaignResource(record),
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * POST - create
   */
  async create(req, res) {
    // define allowed fields
    const formData = {
      slug: req.body.slug,
      name: req.body.name,
      description: req.body.description,
      intro_title: req.body.intro_title,
      intro_description: req.body.intro_description,
      presubmit_title: req.body.presubmit_title,
      presubmit_description: req.body.presubmit_description,
      postsubmit_title: req.body.postsubmit_title,
      postsubmit_description: req.body.postsubmit_description,
      cover: req.body.cover,
      background: req.body.background,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
      review_type: req.body.review_type,
      review_instruction: req.body.review_instruction,
      review_cta: req.body.review_cta,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      quota: req.body.quota,
      vendor_id: req.vendor?.id,
      form_id: req.form?.id,
      theme: req.body.theme,
      status: req.body.status,
      pos: req.body.pos,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const result = await this.campaignService.create(formData, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new CampaignResource(result),
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
    // define allowed fields
    const formData = {
      slug: req.body.slug,
      name: req.body.name,
      description: req.body.description,
      intro_title: req.body.intro_title,
      intro_description: req.body.intro_description,
      presubmit_title: req.body.presubmit_title,
      presubmit_description: req.body.presubmit_description,
      postsubmit_title: req.body.postsubmit_title,
      postsubmit_description: req.body.postsubmit_description,
      cover: req.body.cover,
      background: req.body.background,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
      review_type: req.body.review_type,
      review_instruction: req.body.review_instruction,
      review_cta: req.body.review_cta,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      quota: req.body.quota,
      vendor_id: req.vendor?.id,
      form_id: req.form?.id,
      theme: req.body.theme,
      status: req.body.status,
      pos: req.body.pos,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.campaignService.findById(req.params.id);
      const result = await this.campaignService.update(record, formData, { transaction: t });

      await t.commit();

      // force refersh result
      await result.reload({
        include: [
          { model: Vendor },
          { model: Form },
          { model: Product },
          { model: User },
        ],
      });

      return this.responseJson(req, res, {
        data: new CampaignResource(result),
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
      const record = await this.campaignService.findById(req.params.id);
      const deleted = await this.campaignService.delete(record, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new CampaignResource(deleted),
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
    const forms = await Form.findAll({
      attributes: ['id', 'name'],
    });
    const vendors = await Vendor.findAll({
      attributes: ['id', 'name'],
    });
    const products = await Product.findAll({
      attributes: ['id', 'name'],
      where: {
        status: Product.STATUSES.ACTIVE,
      },
      order: [['pos', 'ASC']],
    });
    const states = [
      { id: 'current', name: 'Current' },
      { id: 'coming', name: 'Coming' },
      { id: 'past', name: 'Past' },
    ];

    const options = {
      forms,
      vendors,
      products,
      statuses: Object.values(Campaign.STATUSES).map((val) => ({
        id: val,
        name: val.charAt(0).toUpperCase() + val.slice(1),
      })),
      review_types: Object.values(Campaign.REVIEW_TYPES).map((val) => ({
        id: val,
        name: val.charAt(0).toUpperCase() + val.slice(1),
      })),
      themes: Object.values(Campaign.THEMES).map((val) => ({
        id: val,
        name: val.charAt(0).toUpperCase() + val.slice(1),
      })),
      states,
      phone_prefixes: allOptions.phonePrefixes,
    };

    return this.responseJson(req, res, {
      data: options,
    });
  }

  /**
   * PUT - update products
   */
  async updateProducts(req, res) {
    // validated
    const formData = {
      products: req.body.products,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.campaignService.findById(req.params.id);
      const updated = await this.campaignService.syncProducts(record, formData.products, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: updated,
      });
      // return this.responseJson(req, res, {
      //   data: new CampaignResource(updated),
      // });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }

  /**
   * GET - report overall stats
   */
  async getReportStats(req, res) {
    const result = await this.campaignService.reportStats(req.params.id);

    return this.responseJson(req, res, {
      data: result,
    });
  }

  /**
   * GET - report overall counts
   */
  async getReportCounts(req, res) {
    const result = await this.campaignService.reportCounts(req.params.id);

    return this.responseJson(req, res, {
      data: result,
    });
  }

  /**
   * GET - get enrolment workflow
   */
  async getWorkflow(req, res) {
    try {
      const campaign = await this.campaignService.findById(req.params.id);
      const record = await campaign.getWorkflow({
        include: [WorkflowTask],
      });

      return this.responseJson(req, res, {
        data: record ? new WorkflowResource(record) : null,
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * PUT - update workflow
   */
  async updateWorkflow(req, res, next) {
    // validated
    const formData = {
      tasks: req.body.tasks,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const campaign = await this.campaignService.findById(req.params.id);
      // create workflow if haven't
      const workflowService = new WorkflowService();

      let record = await campaign.getWorkflow();
      if (!record) {
        record = await workflowService.create({
          name: campaign.name,
          vendor_id: campaign.vendor_id || null,
          created_by: req.user.id,
        }, { transaction: t });

        campaign.enrolment_workflow_id = record.id;
        await campaign.save({ transaction: t });
      }

      // DB validated - task doesn't belongs to other workflow
      // *note 1: id can be new (not exists in DB)
      const taskIds = formData.tasks.map((d) => d.id);
      const tasks = await WorkflowTask.findAll({
        attributes: ['id', 'workflow_id'],
        where: {
          id: taskIds,
        },
        raw: true,
      });
      const invalid = tasks.some((d) => d.workflow_id !== record.id);
      if (invalid) {
        return next(new ValidationFailed('Invalid or duplicated task_id detected.'));
      }

      // update tasks
      const oldTasks = await record.getWorkflowTasks();
      await workflowService.syncTasks(record, formData.tasks, oldTasks, { transaction: t });

      await t.commit();

      // reload
      await record.reload({
        include: [
          { model: WorkflowTask },
        ],
      });

      return this.responseJson(req, res, {
        data: new WorkflowResource(record),
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }
}

module.exports = CampaignController;
