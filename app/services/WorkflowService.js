const { Op } = require('sequelize');
const { getInput } = require('../helpers/utils');
const { consoleLog } = require('../helpers/logger');
const BaseService = require('./BaseService');
const QueueService = require('./QueueService');
const {
  Workflow, WorkflowTask, Campaign, CampaignWorkflow, CampaignEnrolment, User,
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
   * Trigger workflow
   *
   * @param  {string}  campaignWorkflowId
   * @param  {array}  enrolments
   * @return {int}
   */
  async triggerWorkflow(campaignWorkflowId, enrolments) {
    consoleLog('Worlflow:', 'Trigger campaign workflow', campaignWorkflowId);
    const campaignWorkflow = await CampaignWorkflow.findByPk(campaignWorkflowId, {
      include: [
        { model: Campaign },
        {
          model: Workflow,
          include: {
            model: WorkflowTask,
            where: { parent_task_id: null },
          },
        },
      ],
    });

    // invalid - no enrolments
    if (!enrolments?.length) {
      consoleLog('Worlflow:', 'Workflow has no enrolments', campaignWorkflowId);
      return 0;
    }
    // invalid - no workflow / no workflow tasks
    if (!campaignWorkflow?.Workflow?.WorkflowTasks?.length) {
      consoleLog('Worlflow:', 'Invalid workflow_id / workflow no tasks', campaignWorkflowId, campaignWorkflow.workflow_id);
      return 0;
    }

    // trigger tasks
    /**
     * NOTE:
     * - some tasks will auto group all enrolments into single action instead of multiple if isManual
     */
    const autoGroupActions = [
      'send_email', 'send_sms',
    ];
    const queueService = new QueueService();
    // assuming provided tasks is root
    const promises = [];
    campaignWorkflow.Workflow.WorkflowTasks.forEach((task) => {
      const queueData = {
        campaign: {
          id: campaignWorkflow.Campaign?.id,
          name: campaignWorkflow.Campaign?.name,
        },
      };
      if (autoGroupActions.includes(task.action) && enrolments.length > 1) {
        // generate single action for all enrolments
        queueData.enrolments = enrolments.map((d) => d.id);
        promises.push(queueService.pushQueueTask(task.id, queueData));
      } else {
        // generate action for each enrolment
        enrolments.forEach((enrolment) => {
          queueData.enrolment = {
            id: enrolment.id,
            user: {
              id: enrolment.User?.id,
              name: enrolment.User?.name,
              email: enrolment.User?.email,
              contact: enrolment.User?.contact,
            },
          };
          promises.push(queueService.pushQueueTask(task.id, queueData));
        });
      }
    });

    try {
      await Promise.all(promises);
      consoleLog('Worlflow:', 'Trigger campaign workflow end', campaignWorkflowId);
      return promises.length;
    } catch (err) {
      consoleLog('WorlflowErr: Trigger campaign workflow', campaignWorkflowId, err.message);
      return 0;
    }
  }

  /**
   * Trigger enrolment submission workflow
   *
   * @param  {string}  campaignId
   * @param  {array}  enrolmentIds
   * @return {int}
   */
  async triggerEnrolmentWorkflow(campaignId, enrolmentIds = null) {
    consoleLog('Worlflow:', 'Trigger by campaign', campaignId);
    const campaign = await Campaign.findByPk(campaignId);
    const workflows = await campaign.getCampaignWorkflows({
      where: {
        enable: true,
      },
    });

    // no workflows
    if (!workflows) {
      consoleLog('Worlflow:', 'Campaign do not have workflows - end', campaignId);
      return 0;
    }

    // find affected enrolments
    const conds = {};
    if (enrolmentIds?.length) {
      conds.id = enrolmentIds;
    } else {
      conds.status = {
        [Op.ne]: CampaignEnrolment.STATUSES.REJECT,
      };
    }
    const enrolments = await campaign.getCampaignEnrolments({
      where: conds,
      include: [
        { model: User },
      ],
    });
    // no enrolments
    if (!enrolments?.length) {
      consoleLog('Worlflow:', 'Campaign do not have enrolments - end', campaignId);
      return 0;
    }

    // sync
    const results = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const workflow of workflows) {
      // eslint-disable-next-line no-await-in-loop
      const count = await this.triggerWorkflow(workflow.id, enrolments);
      results.push(count);
    }
    // async
    // const triggers = workflows.map(async (workflow) => {
    //   const count = await this.triggerWorkflow(workflow.id, enrolments);
    //   return count;
    // });
    // const results = await Promise.all(triggers);
    const totalTasks = results.reduce((a, d) => (a + d), 0);

    consoleLog('Worlflow:', 'Trigger by campaign end', campaignId);
    return totalTasks;

    // const enrolment = await CampaignEnrolment.findByPk(enrolmentId, {
    //   include: [
    //     { model: Campaign },
    //     { model: User },
    //   ],
    // });

    // let promises = [];
    // if (enrolment?.Campaign?.enrolment_workflow_id) {
    //   const rootTasks = await WorkflowTask.findAll({
    //     where: {
    //       workflow_id: enrolment.Campaign.enrolment_workflow_id,
    //       parent_task_id: null,
    //     },
    //   });
    //   if (rootTasks?.length) {
    //     const queueService = new QueueService();
    //     // cache minimum info only
    //     const queueData = {
    //       enrolments: [
    //         {
    //           id: enrolment.id,
    //           user: {
    //             id: enrolment.User?.id,
    //             name: enrolment.User?.name,
    //             email: enrolment.User?.email,
    //             contact: enrolment.User?.contact,
    //           },
    //         },
    //       ],
    //       campaign: {
    //         id: enrolment.Campaign.id,
    //         name: enrolment.Campaign.name,
    //       },
    //     };
    //     promises = rootTasks.map(async (task) => {
    //       await queueService.pushQueueTask(task.id, queueData);
    //     });
    //     try {
    //       await Promise.all(promises);
    //     } catch (err) {
    //       consoleLog('WorlflowErr: Trigger by enrolment', enrolmentId, err.message);
    //       return 0;
    //     }
    //   }
    // }

    // consoleLog('Worlflow:', 'Trigger by enrolment end', enrolmentId);
    // return promises.length;
  }
}

module.exports = WorkflowService;
