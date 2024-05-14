const { addHours } = require('date-fns');
const BaseService = require('./BaseService');
const { QueueTask, WorkflowTask } = require('../models');

class QueueService extends BaseService {
  constructor() {
    super(QueueTask);
  }

  async create(input, options = {}) {
    const formData = {
      id: input.id || (new Date()).getTime(),
      task_id: input.task_id,
      task_action: input.task_action,
      task_config: input.task_config,
      task_data: input.task_data,
      task_pos: input.task_pos || null,
      task_parent_id: input.task_parent_id || null,
      workflow_id: input.workflow_id,
      status: input.status || QueueTask.STATUSES.PENDING,
      parent_queue_id: input.parent_queue_id || null,
      grand_parent_queue_id: input.grand_parent_queue_id || null,
      retry_count: input.retry_count || 0,
      trigger_at: input.trigger_at || new Date(),
      created_at: new Date(),
    };

    const result = await this.model.create(formData, options);
    return result;
  }

  async generateQueueTasks(record, input, options = {}) {
    const tasks = await record.getWorkflowTasks();
    const queueItems = [];

    function getParentTask(parentId) {
      if (parentId === null) return null;
      const parentQueue = queueItems.find((item) => item.task_id === parentId);
      return parentQueue || null;
    }

    function generateQueue(task, triggerTime = new Date()) {
      const uid = `${(new Date()).getTime()}_${queueItems.length + 1}`;
      let triggerAt = new Date(triggerTime.getTime());
      const parentQueue = getParentTask(task.parent_task_id);
      if (parentQueue) {
        triggerAt.setTime(parentQueue.trigger_at.getTime());
      }

      // grand_parent
      let grandQueueId = null;
      if (task.pos) {
        grandQueueId = parentQueue?.id || null;
      } else {
        grandQueueId = parentQueue?.grand_parent_queue_id || null;
      }

      // apply delay
      if (task.action === 'delay_action') {
        triggerAt = addHours(triggerAt, task.config?.duration || 0);
      }

      // construct queue item
      const queue = {
        id: uid,
        task_action: task.action,
        task_pos: task.pos,
        task_config: task.config,
        task_data: input,
        workflow_id: task.workflow_id,
        status: QueueTask.STATUSES.PENDING,
        task_id: task.id,
        task_parent_id: task.parent_task_id,
        parent_queue_id: parentQueue?.id || null,
        grand_parent_queue_id: grandQueueId,
        trigger_at: triggerAt,
      };
      queueItems.push(queue);

      // child tasks
      const childs = tasks.filter((d) => d.parent_task_id === task.id);
      childs.forEach((d) => generateQueue(d, triggerAt));
    }

    const rootTasks = tasks.filter((d) => d.parent_task_id === null);
    rootTasks.forEach((d) => generateQueue(d));

    // DB update
    await this.model.bulkCreate(queueItems, options);

    return queueItems;
  }

  // using direct
  async pushQueueTask(taskId, data, metadata = {}) {
    const task = await WorkflowTask.findByPk(taskId);
    if (!task) {
      console.log('Error: invalid taskId', taskId, task.parent_task_id);
      return;
    }
    const input = {
      task_id: task.id,
      task_action: task.action,
      task_config: task.config,
      task_data: data,
      task_pos: task.pos,
      task_parent_id: task.parent_task_id,
      workflow_id: task.workflow_id,
      status: QueueTask.STATUSES.PENDING,
      parent_queue_id: metadata.parent_queue_id || null,
      // grand_parent_queue_id: metadata.grand_parent_queue_id || null,
      trigger_at: metadata.trigger_at || new Date(),
    };
    const queue = await this.create(input);

    // sync drive
    console.log('Push to queue:', queue.id);
    await this.triggerQueueTask(queue.id);
  }

  async triggerQueueTask(queueId) {
    const queue = await this.model.findByPk(queueId);
    console.log('Trigger:', queue.id, queue.trigger_at);

    const { result, pos, modifier } = await this.runTask(queue.task_action, queue.task_data, queue.task_config);

    queue.execute_at = new Date();
    queue.status = QueueTask.STATUSES.COMPLETED;
    queue.result_obj = result;
    await queue.save();

    // prepare next queue item
    const tasks = await WorkflowTask.findAll({
      where: {
        workflow_id: queue.workflow_id,
      },
      raw: true,
    });
    console.log(tasks);
    function getTopTreeNode(parentId) {
      const parent = tasks.find((d) => d.id === parentId);
      if (!parent || !parent.parent_task_id) return null;
      if (parent.pos) {
        return tasks.find((d) => d.id === parent.parent_task_id);
      }
      return getTopTreeNode(parent.parent_task_id);
    }
    function getGrandParentDirectNode(taskId) {
      const task = tasks.find((d) => d.id === taskId);
      // stopper
      if (!task || !task.parent_task_id) return null;

      // tree top
      let topNode = getTopTreeNode(task.parent_task_id);
      if (!topNode) {
        topNode = tasks.find((d) => d.id === task.parent_task_id);
      }
      if (topNode) {
        const directNode = tasks.find((d) => d.parent_task_id === topNode.id && !d.pos);
        if (directNode && directNode.id !== taskId) {
          return directNode;
        }
      }

      // @tbc
      // return getGrandParentDirectNode(topNode.id);
      return null;
    }
    let nextTaskId = null;
    // case 1: conditional node
    if (pos) {
      const condNode = tasks.find((d) => d.parent_task_id === queue.task_id && d.pos === pos);
      nextTaskId = condNode?.id;
    }
    // case 2: direct node
    if (!nextTaskId) {
      const directNode = tasks.find((d) => d.parent_task_id === queue.task_id && !d.pos);
      nextTaskId = directNode?.id;
    }
    // case 3: conditional node(s) ended, continue parent tree
    if (!nextTaskId) {
      const directNode = getGrandParentDirectNode(queue.task_id);
      nextTaskId = directNode?.id;
    }

    if (!nextTaskId) {
      console.log('Trigger completed');
      return;
    }

    let nextTriggerAt = new Date(queue.trigger_at);
    if (modifier?.trigger_delay) {
      nextTriggerAt = addHours(nextTriggerAt, modifier.trigger_delay);
    }

    const metadata = {
      parent_queue_id: queue.id,
      trigger_at: nextTriggerAt,
    };
    await this.pushQueueTask(nextTaskId, queue.task_data, metadata);
  }

  // using DB tracker
  async pushQueueTask2(queueId) {
    const queueItem = await this.model.findByPk(queueId);
    console.log('Push queue:', queueId, queueItem.task_action);

    // sync driver
    await this.triggerQueueTask2(queueId);
  }

  async triggerQueueTask2(queueId) {
    const queueItem = await this.model.findByPk(queueId);
    // if (queueItem.status === QueueTask.STATUSES.COMPLETED) {
    //   console.log('Queue task already completed.');
    //   return;
    // }
    // if (queueItem.status !== QueueTask.STATUSES.FAILED) {
    //   console.log('Queue task already triggered.');
    //   return;
    // }

    console.log('Trigger:', queueItem.task_action, queueItem.trigger_at);
    const { result, pos } = await this.runTask(queueItem.task_action, queueItem.task_data, queueItem.task_config);
    console.log(result, pos);

    queueItem.execute_at = new Date();
    queueItem.status = QueueTask.STATUSES.COMPLETED;
    queueItem.result_obj = result;
    await queueItem.save();

    // prepare next queue item
    const chainedItems = await this.model.findAll({
      attributes: ['id', 'task_pos'],
      where: {
        parent_queue_id: queueItem.id,
      },
      raw: true,
    });
    if (!chainedItems?.length) {
      console.log('Trigger completed');
      return;
    }
    const items = chainedItems.reduce((acc, cur) => ({
      ...acc,
      [cur.task_pos || '']: cur.id,
    }), {});
    // console.log(chainedItems, items);

    const nextQueueItemId = items[pos || ''] || null;
    if (!nextQueueItemId) {
      console.log('Something wrong... Trigger stopped');
      return;
    }
    await this.pushQueueTask(nextQueueItemId);
  }

  async runTask(action, data, config) {
    function wait(ms) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    }

    // delay
    if (action === 'delay_action') {
      console.log('Task delay');
      return {
        pos: null,
        result: null,
        modifier: {
          trigger_delay: config?.duration || 0,
        },
      };
    }

    // API call
    if (action === 'call_api') {
      console.log('Task API call');
      await wait(1000);
      return {
        pos: 'left',
        result: { api_response: false },
        modifier: null,
      };
    }

    return {
      pos: null,
      result: null,
      modifier: null,
    };
  }
}

module.exports = QueueService;
