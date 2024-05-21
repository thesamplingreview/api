const { Op } = require('sequelize');
const { getInput } = require('../helpers/utils');
const { consoleLog } = require('../helpers/logger');
const BaseService = require('./BaseService');
const QueueService = require('./QueueService');
const {
  Workflow, WorkflowTask, CampaignEnrolment, Campaign, User,
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
      vendor_id: input.vendor_id || null,
      created_by: input.created_by || null,
      created_at: input.created_at || new Date(),
    };

    const result = await this.model.create(formData, options);

    return result;
  }

  async update(record, input, options = {}) {
    const formData = {
      name: getInput(input.name, record.name),
      vendor_id: getInput(input.vendor_id, record.vendor_id),
    };

    const result = await record.update(formData, options);

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
   * Trigger enrolment submission workflow
   *
   * @param  {string}  enrolmentId
   * @return {int}
   */
  async triggerEnrolmentWorkflow(enrolmentId) {
    consoleLog('Worlflow:', 'Trigger by enrolment', enrolmentId);
    const enrolment = await CampaignEnrolment.findByPk(enrolmentId, {
      include: [
        { model: Campaign },
        { model: User },
      ],
    });

    let promises = [];
    if (enrolment?.Campaign?.enrolment_workflow_id) {
      const rootTasks = await WorkflowTask.findAll({
        where: {
          workflow_id: enrolment.Campaign.enrolment_workflow_id,
          parent_task_id: null,
        },
      });
      if (rootTasks?.length) {
        const queueService = new QueueService();
        // cache minimum info only
        const queueData = {
          enrolment_id: enrolment.id,
          campaign: {
            id: enrolment.Campaign.id,
            name: enrolment.Campaign.name,
          },
          user: {
            id: enrolment.User?.id,
            name: enrolment.User?.name,
            email: enrolment.User?.email,
            contact: enrolment.User?.contact,
          },
        };
        promises = rootTasks.map(async (task) => {
          await queueService.pushQueueTask(task.id, queueData);
        });
        try {
          await Promise.all(promises);
        } catch (err) {
          consoleLog('WorlflowErr: Trigger by enrolment', enrolmentId, err.message);
          return 0;
        }
      }
    }

    consoleLog('Worlflow:', 'Trigger by enrolment end', enrolmentId);
    return promises.length;
  }
}

module.exports = WorkflowService;
