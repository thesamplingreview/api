const { Sequelize, Op } = require('sequelize');
const ApiController = require('../ApiController');
const allOptions = require('../../../config/options');
const {
  sequelize, Campaign, CampaignWorkflow, CampaignEnrolment, WorkflowTask, Vendor, User,
} = require('../../models');
const WorkflowService = require('../../services/WorkflowService');
const ConfigService = require('../../services/ConfigService');
const WorkflowResource = require('../../resources/WorkflowResource');
const { ValidationFailed, ModelNotFound } = require('../../errors');

class WorkflowController extends ApiController {
  constructor() {
    super();

    this.workflowService = new WorkflowService();
  }

  /**
   * GET - all
   */
  async getAll(req, res) {
    // inject vendor-only filter
    req.query.vendor_id = req.user.vendor_id;

    try {
      const query = {
        where: this.workflowService.genWhereQuery(req),
        order: this.workflowService.genOrdering(req),
        include: [
          { model: CampaignWorkflow },
          { model: Vendor },
        ],
        attributes: {
          include: [
            [Sequelize.literal('(SELECT COUNT(*) FROM `workflow_tasks` AS `WorkflowTasks` WHERE `WorkflowTasks`.`workflow_id` = `Workflow`.`id`)'), 'workflowTasksCount'],
          ],
        },
      };
      const { page, perPage } = this.getPaginate(req);
      const results = await this.workflowService.paginate(query, page, perPage);

      return this.responsePaginate(req, res, {
        data: WorkflowResource.collection(results.data),
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
      const record = await this.workflowService.findOne({
        where: {
          id: req.params.id,
          vendor_id: req.user.vendor_id,
        },
        include: [
          { model: Vendor },
          { model: WorkflowTask },
          { model: CampaignWorkflow },
        ],
      });

      return this.responseJson(req, res, {
        data: new WorkflowResource(record),
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
      name: req.body.name,
      trigger: req.body.trigger,
      campaign_id: req.body.campaign_id,
      created_by: req.user.id,
    };
    formData.vendor_id = req.user.vendor_id;

    // DB update
    const t = await sequelize.transaction();
    try {
      const result = await this.workflowService.create(formData, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new WorkflowResource(result),
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
      name: req.body.name,
      enable: req.body.enable,
      trigger: req.body.trigger,
      // campaign_id: req.body.campaign_id,
      // vendor_id: req.body.vendor_id,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.workflowService.findOne({
        where: {
          id: req.params.id,
          vendor_id: req.user.vendor_id,
        },
      });
      const result = await this.workflowService.update(record, formData, { transaction: t });

      await t.commit();

      // force refersh result
      await result.reload({
        include: [
          { model: Vendor },
          { model: WorkflowTask },
          { model: CampaignWorkflow },
        ],
      });

      return this.responseJson(req, res, {
        data: new WorkflowResource(result),
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
      const record = await this.workflowService.findOne({
        where: {
          id: req.params.id,
          vendor_id: req.user.vendor_id,
        },
      });
      const deleted = await this.workflowService.delete(record, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new WorkflowResource(deleted),
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
    const configService = new ConfigService();
    const {
      wf_send_user_mail_tmpls,
      wf_send_user_whatsapp_tmpls,
    } = await configService.getKeys([
      'wf_send_user_mail_tmpls',
      'wf_send_user_whatsapp_tmpls',
    ]);

    const convertTextareaToOptions = (input) => {
      return input.trim()
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          const [id, name] = line.split(':').map((str) => str.trim());
          return {
            id,
            name: name || id,
          };
        });
    };

    const options = {
      mailTmpls: convertTextareaToOptions(wf_send_user_mail_tmpls),
      waTmpls: convertTextareaToOptions(wf_send_user_whatsapp_tmpls),
      phone_prefixes: allOptions.phonePrefixes,
      workflow_triggers: Object.values(CampaignWorkflow.TRIGGERS).map((val) => ({
        id: val,
        name: allOptions.workflowTriggers?.[val] || val,
      })),
    };

    return this.responseJson(req, res, {
      data: options,
    });
  }

  /**
   * PUT - add products
   */
  async updateTasks(req, res, next) {
    // validated
    const formData = {
      tasks: req.body.tasks,
    };

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
    const invalid = tasks.some((d) => d.workflow_id !== req.params.id);
    if (invalid) {
      return next(new ValidationFailed('Invalid or duplicated task_id detected.'));
    }

    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.workflowService.findOne({
        where: {
          id: req.params.id,
          vendor_id: req.user.vendor_id,
        },
      });
      const result = await this.workflowService.update(record, formData, { transaction: t });

      await t.commit();

      // reload
      await result.reload({
        include: [
          { model: CampaignWorkflow },
          { model: WorkflowTask },
          { model: Vendor },
        ],
      });

      return this.responseJson(req, res, {
        data: new WorkflowResource(result),
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }

  /**
   * PUT - trigger campaign workflow
   */
  async triggerCampaignWorkflow(req, res) {
    try {
      const campaignWorkflow = await CampaignWorkflow.findOne({
        where: {
          id: req.params.id,
        },
        include: [
          {
            model: Campaign,
            where: { vendor_id: req.user.vendor_id },
          },
        ],
      });
      if (!campaignWorkflow) {
        throw new ModelNotFound('Data not found');
      }

      // validate - workflow
      const workflow = await campaignWorkflow.getWorkflow({
        include: [
          { model: WorkflowTask },
        ],
      });
      if (!workflow?.WorkflowTasks?.length) {
        throw new ValidationFailed('Workflow does not have any actions');
      }

      // validate - enrolments (not rejected)
      const enrolments = await CampaignEnrolment.findAll({
        where: {
          campaign_id: campaignWorkflow.campaign_id,
          status: {
            [Op.ne]: CampaignEnrolment.STATUSES.REJECT,
          },
        },
        include: [
          { model: User },
        ],
      });
      // no enrolments
      if (!enrolments?.length) {
        throw new ValidationFailed('Campaign does not have available enrolments');
      }

      // trigger
      const count = await this.workflowService.triggerCampaignWorkflow(campaignWorkflow.id);
      return this.responseJson(req, res, {
        data: `${count} tasks scheduled.`,
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }
}

module.exports = WorkflowController;
