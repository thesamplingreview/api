const { Op } = require('sequelize');
const { getInput } = require('../helpers/utils');
const BaseService = require('./BaseService');
const { Workflow, WorkflowTask } = require('../models');

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
      currTask.name = task.name;
      currTask.type = task.type || null;
      currTask.config = task.config || null;
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
}

module.exports = WorkflowService;
