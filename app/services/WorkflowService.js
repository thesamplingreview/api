const { Op } = require('sequelize');
const { getInput } = require('../helpers/utils');
const { consoleLog } = require('../helpers/logger');
const BaseService = require('./BaseService');
const QueueService = require('./QueueService');
const {
  Workflow, WorkflowTask, Campaign, CampaignWorkflow, CampaignEnrolment, CampaignReview, User,
} = require('../models');

class WorkflowService extends BaseService {
  constructor() {
    super(Workflow);
  }

  genWhereQuery(req) {
    const whereQuery = {};

    // filter - vendor_id
    if (req.query.vendor_id?.trim()) {
      whereQuery.vendor_id = req.query.vendor_id;
    }
    // filter - campaign_id
    if (req.query.campaign_id) {
      whereQuery['$CampaignWorkflow.campaign_id$'] = req.query.campaign_id;
    }

    return whereQuery;
  }

  genOrdering(req) {
    // currently only support single column ordering
    const sort = super.getSortMeta(req);
    return sort ? [sort] : [['name', 'ASC']];
  }

  async create(input, options = {}) {
    const formData = {
      name: input.name,
      trigger: input.trigger,
      campaign_id: input.campaign_id,
      vendor_id: input.vendor_id || null,
      created_by: input.created_by || null,
      created_at: input.created_at || new Date(),
    };

    const result = await this.model.create(formData, options);
    await CampaignWorkflow.create({
      campaign_id: formData.campaign_id,
      workflow_id: result.id,
      trigger: formData.trigger,
      enable: true,
    }, options);

    return result;
  }

  async update(record, input, options = {}) {
    const formData = {
      name: getInput(input.name, record.name),
      vendor_id: getInput(input.vendor_id, record.vendor_id),
    };

    const result = await record.update(formData, options);

    if (record.CampaignWorkflow) {
      const linkedFormData = {
        trigger: getInput(input.trigger, record.CampaignWorkflow.trigger),
        enable: getInput(input.enable, record.CampaignWorkflow.enable),
      };
      await record.CampaignWorkflow.update(linkedFormData, options);
    }

    if (input.tasks?.length) {
      const oldTasks = await record.getWorkflowTasks();
      await this.syncTasks(result, input.tasks, oldTasks, options);
    }

    return result;
  }

  /**
   * Sync workflow <> tasks dataset
   * - this method will auto-cleanup old records if the record was not included inside `tasks`
   *
   * @param  {model}  record
   * @param  {array}  newTasks
   * @param  {model[]}  oldTasks
   * @param  {object}  options - sequelize transaction
   * @return {model[]}
   */
  async syncTasks(record, newTasks, oldTasks, options = {}) {
    // using oldTask to double check if task under the workflow in order to prevent passing another workflow task
    const promises = newTasks.map(async (task) => {
      let currTask;
      if (task.id) {
        currTask = oldTasks.find((d) => d.id === task.id);
      }
      if (!currTask) {
        currTask = new WorkflowTask();
      }
      currTask.id = task.id;
      currTask.action = task.action;
      currTask.config = task.config || null;
      currTask.pos = task.pos || null;
      currTask.parent_task_id = task.parent_task_id || null;
      currTask.workflow_id = record.id;

      const result = await currTask.save(options);
      return result;
    });
    const results = await Promise.all(promises);

    // clean up orpaned records
    const newIds = results.map((d) => d.id);
    await WorkflowTask.destroy({
      where: {
        id: { [Op.notIn]: newIds },
        workflow_id: record.id,
      },
      ...options,
    });

    return results;
  }

  /**
   * Trigger campaign workflow
   *
   * @param  {string}  campaignWorkflowId
   * @param  {string}  singleId
   * @return {int}
   */
  async triggerCampaignWorkflow(campaignWorkflowId, singleId = '') {
    consoleLog('Worlflow:', 'Run campaign workflow', campaignWorkflowId);
    const campaignWorkflow = await CampaignWorkflow.findByPk(campaignWorkflowId, {
      include: [
        { model: Campaign },
      ],
    });
    // validate - campaign
    const campaign = campaignWorkflow?.Campaign;
    if (!campaign) {
      consoleLog('Worlflow:', 'CampaignWorkflow does not have linked campaign', campaignWorkflowId);
      return 0;
    }

    const queueData = {
      campaign: {
        id: campaign.id,
        name: campaign.name,
      },
    };

    if (campaignWorkflow.trigger === CampaignWorkflow.TRIGGERS.NEW_ENROLMENT) {
      if (singleId) {
        // case 1 - trigger for single enrolment only
        const enrolment = await CampaignEnrolment.findByPk(singleId, {
          include: [
            { model: User },
          ],
        });
        if (!enrolment) {
          consoleLog('Worlflow:', 'Invalid enrolment ID', campaignWorkflowId, singleId);
          return 0;
        }
        // inject queueData
        queueData.isAuto = true;
        queueData.trigger = 'enrolment';
        queueData.user = {
          id: enrolment.User?.id,
          name: enrolment.User?.name,
          contact: enrolment.User?.contact,
          email: enrolment.User?.email,
        };
        queueData.enrolment = {
          id: enrolment.id,
        };
      } else {
        // case 2 - trigger for all campaign enrolments (manual)
        const enrolments = await CampaignEnrolment.findAll({
          where: {
            campaign_id: campaignWorkflow.Campaign.id,
            status: {
              [Op.ne]: CampaignEnrolment.STATUSES.REJECT,
            },
          },
        });
        if (!enrolments.length) {
          consoleLog('Worlflow:', 'Linked campaign does not have available enrolments', campaignWorkflowId);
          return 0;
        }
        // inject queueData
        queueData.isAuto = false;
        queueData.trigger = 'enrolment';
      }
    } else if (campaignWorkflow.trigger === CampaignWorkflow.TRIGGERS.NEW_REVIEW) {
      if (singleId) {
        // case 1 - trigger for single review only
        const review = await CampaignReview.findByPk(singleId, {
          include: [
            { model: User },
          ],
        });
        if (!review) {
          consoleLog('Worlflow:', 'Invalid review ID', campaignWorkflowId, singleId);
          return 0;
        }
        // inject queueData
        queueData.isAuto = true;
        queueData.trigger = 'review';
        queueData.user = {
          id: review.User?.id,
          name: review.User?.name,
          contact: review.User?.contact,
          email: review.User?.email,
        };
        queueData.review = {
          id: review.id,
        };
      } else {
        // case 2 - trigger for all campaign reviews (manual)
        const reviews = await CampaignReview.findAll({
          where: {
            campaign_id: campaignWorkflow.Campaign.id,
          },
        });
        if (!reviews.length) {
          consoleLog('Worlflow:', 'Linked campaign does not have available reviews', campaignWorkflowId);
          return 0;
        }
        // inject queueData
        queueData.isAuto = false;
        queueData.trigger = 'review';
      }
    } else {
      consoleLog('Worlflow:', 'Unknown trigger - end', campaignWorkflowId, campaignWorkflow.trigger);
      return 0;
    }

    // validate - workflow tasks
    const workflow = await campaignWorkflow.getWorkflow({
      include: [
        {
          model: WorkflowTask,
          where: { parent_task_id: null }, // get root task only
        },
      ],
    });
    if (!workflow?.WorkflowTasks?.length) {
      consoleLog('Worlflow:', 'Linked workflow does not have tasks', campaignWorkflowId);
      return 0;
    }

    // generate queue
    const queueService = new QueueService();
    const promises = workflow.WorkflowTasks.map((task) => {
      return queueService.pushQueueTask(task.id, queueData);
    });
    try {
      await Promise.all(promises);
      consoleLog('Worlflow:', 'Run campaign workflow - end', campaignWorkflowId);
      return promises.length;
    } catch (err) {
      consoleLog('WorlflowErr:', 'Run campaign workflow', campaignWorkflowId, err.message);
      return 0;
    }
  }

  /**
   * Trigger campaign's workflow by enrolment
   *
   * @param  {Model}  enrolment
   * @return {int}
   */
  async triggerWorkflowByEnrolment(enrolment) {
    consoleLog('Worlflow:', 'Trigger by enrolment', enrolment.id);
    const campaign = await enrolment.getCampaign({
      include: [
        {
          model: CampaignWorkflow,
          where: {
            trigger: CampaignWorkflow.TRIGGERS.NEW_ENROLMENT,
            enable: true,
          },
        },
      ],
    });

    // validate - no workflows
    if (!campaign.CampaignWorkflows.length) {
      consoleLog('Worlflow:', 'Enrolment\'s campaign does not have auto-trigger workflows - end', enrolment.id);
      return 0;
    }

    // trigger campaign workflows
    const promises = campaign.CampaignWorkflows.map(async (campaignWorkflow) => {
      const count = await this.triggerCampaignWorkflow(campaignWorkflow.id, enrolment.id);
      return count;
    });
    const results = await Promise.all(promises);
    const totalTasks = results.reduce((a, c) => (a + c), 0);

    consoleLog('Worlflow:', `Trigger by enrolment - end (${totalTasks} tasks)`, enrolment.id);

    return totalTasks;
  }

  /**
   * Trigger campaign's workflow by review
   *
   * @param  {Model}  review
   * @return {int}
   */
  async triggerWorkflowByReview(review) {
    consoleLog('Worlflow:', 'Trigger by review', review.id);
    const campaign = await review.getCampaign({
      include: [
        {
          model: CampaignWorkflow,
          where: {
            trigger: CampaignWorkflow.TRIGGERS.NEW_REVIEW,
            enable: true,
          },
        },
      ],
    });

    // validate - no workflows
    if (!campaign.CampaignWorkflows.length) {
      consoleLog('Worlflow:', 'Review\'s campaign does not have auto-trigger workflows - end', review.id);
      return 0;
    }

    // trigger campaign workflows
    const promises = campaign.CampaignWorkflows.map(async (campaignWorkflow) => {
      const count = await this.triggerCampaignWorkflow(campaignWorkflow.id, review.id);
      return count;
    });
    const results = await Promise.all(promises);
    const totalTasks = results.reduce((a, c) => (a + c), 0);

    consoleLog('Worlflow:', `Trigger by review - end (${totalTasks} tasks)`, review.id);

    return totalTasks;
  }
}

module.exports = WorkflowService;
