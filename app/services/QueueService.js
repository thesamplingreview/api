const { Op } = require('sequelize');
const { addHours } = require('date-fns');
const { strMap } = require('../helpers/utils');
const { consoleLog } = require('../helpers/logger');
const { sendMail, sendMailUsingTmpl } = require('../helpers/mailer');
const { sendSMS } = require('../helpers/sms');
const BaseService = require('./BaseService');
const { sequelize, QueueTask, WorkflowTask } = require('../models');

class QueueService extends BaseService {
  constructor() {
    super(QueueTask);
  }

  async create(input, options = {}) {
    const formData = {
      task_id: input.task_id,
      task_action: input.task_action,
      task_config: input.task_config,
      task_data: input.task_data,
      task_pos: input.task_pos || null,
      task_parent_id: input.task_parent_id || null,
      workflow_id: input.workflow_id,
      parent_queue_id: input.parent_queue_id || null,
      status: input.status || QueueTask.STATUSES.PENDING,
      // grand_parent_queue_id: input.grand_parent_queue_id || null,
      retry_count: input.retry_count || 0,
      trigger_at: input.trigger_at || new Date(),
      created_at: new Date(),
    };

    const result = await this.model.create(formData, options);
    return result;
  }

  /**
   * Get runnable queueTask
   *
   * @return QueueTask
   */
  async getNextQueue() {
    const now = new Date();
    const queueTask = await this.model.findOne({
      where: {
        trigger_at: {
          [Op.lt]: now,
        },
        execute_at: null,
        status: QueueTask.STATUSES.PENDING,
      },
    });
    return queueTask;
  }

  /**
   * Create queue from task
   *
   * @param {string} taskId
   * @param {object} data - data for task
   * @param {object} metadata - task metadata
   * @return void
   */
  async pushQueueTask(taskId, data, metadata = {}) {
    const task = await WorkflowTask.findByPk(taskId);
    if (!task) {
      consoleLog('PushQueueErr:', 'Invalid taskId -', taskId);
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
      trigger_at: metadata.trigger_at || new Date(),
    };

    const transaction = await sequelize.transaction();
    try {
      const queue = await this.create(input, { transaction });
      await transaction.commit();
      consoleLog('PushQueue:', 'Queue created -', queue.id);

      // sync drive
      // await this.runQueueTask(queue);
    } catch (err) {
      await transaction.rollback();
      consoleLog('PushQueueErr:', err.message);
    }
  }

  /**
   * Run queue task
   *
   * @param {model} queue
   * @return void
   */
  async runQueueTask(queue) {
    if (!queue) {
      consoleLog('TriggerQueueErr', 'Invalid queue');
      return;
    }
    // prevent re-run of queue
    if (queue.status !== QueueTask.STATUSES.PENDING) {
      consoleLog('TriggerQueueErr:', 'Already triggered -', queue.id);
      return;
    }

    consoleLog('TriggerQueue', 'Start running -', queue.id);
    const transaction = await sequelize.transaction();
    try {
      const { result, pos, modifier } = await this.runTask(
        queue.task_action,
        queue.task_data || {},
        queue.task_config || {},
      );
      queue.execute_at = new Date();
      queue.status = QueueTask.STATUSES.COMPLETED;
      queue.result_obj = result;
      await queue.save();
      await transaction.commit();
      consoleLog('TriggerQueue:', 'End running -', queue.id);

      const nextTaskId = await this.findNextTaskId(queue, pos);
      if (!nextTaskId) {
        consoleLog('TriggerQueue', 'End of workflow tree -', queue.id);
        return;
      }

      // continue queue next task
      let nextTriggerAt = new Date(queue.trigger_at);
      if (modifier?.trigger_delay) {
        nextTriggerAt = addHours(nextTriggerAt, modifier.trigger_delay);
      }

      const metadata = {
        parent_queue_id: queue.id,
        trigger_at: nextTriggerAt,
      };
      await this.pushQueueTask(nextTaskId, queue.task_data, metadata);
    } catch (err) {
      await transaction.rollback();
      consoleLog('TriggerQueue:', err.message);

      // apply retry
      // @todo: need to apply delay on retry
      if (queue.retry_count < 1) {
        consoleLog('TriggerQueue:', 'Retry task', queue.id);
        queue.retry_count += 1;
        await queue.save();
        await this.runQueueTask(queue);
      } else {
        consoleLog('TriggerQueue:', 'All retry failed', queue.id);
        queue.status = QueueTask.STATUSES.FAILED;
        queue.execute_at = new Date();
        queue.error_message = err.message;
        await queue.save();

        // proceed next
        // @tbc
        const nextTaskId = await this.findNextTaskId(queue, null);
        if (!nextTaskId) {
          consoleLog('TriggerQueue', 'End of workflow tree -', queue.id);
          return;
        }
        // continue queue next task
        const metadata = {
          parent_queue_id: queue.id,
          trigger_at: new Date(queue.trigger_at),
        };
        await this.pushQueueTask(nextTaskId, queue.task_data, metadata);
      }
    }
  }

  async findNextTaskId(queueNode, pos) {
    const tasks = await WorkflowTask.findAll({
      where: {
        workflow_id: queueNode.workflow_id,
      },
      raw: true,
    });
    // console.log(tasks);

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
      const condNode = tasks.find((d) => d.parent_task_id === queueNode.task_id && d.pos === pos);
      nextTaskId = condNode?.id;
    }
    // case 2: direct node (if no/invalid conditional node)
    if (!nextTaskId) {
      const directNode = tasks.find((d) => d.parent_task_id === queueNode.task_id && !d.pos);
      nextTaskId = directNode?.id;
    }
    // case 3: conditional tree ended, continue parent direct node
    if (!nextTaskId) {
      const directNode = getGrandParentDirectNode(queueNode.task_id);
      nextTaskId = directNode?.id;
    }

    return nextTaskId;
  }

  // DEPRECATED - using on demand quene tasks creation (next queue tasks will be created when completion of current queue task)
  // async generateQueueTasks(record, input, options = {}) {
  //   const tasks = await record.getWorkflowTasks();
  //   const queueItems = [];

  //   function getParentTask(parentId) {
  //     if (parentId === null) return null;
  //     const parentQueue = queueItems.find((item) => item.task_id === parentId);
  //     return parentQueue || null;
  //   }

  //   function generateQueue(task, triggerTime = new Date()) {
  //     const uid = `${(new Date()).getTime()}_${queueItems.length + 1}`;
  //     let triggerAt = new Date(triggerTime.getTime());
  //     const parentQueue = getParentTask(task.parent_task_id);
  //     if (parentQueue) {
  //       triggerAt.setTime(parentQueue.trigger_at.getTime());
  //     }

  //     // grand_parent
  //     let grandQueueId = null;
  //     if (task.pos) {
  //       grandQueueId = parentQueue?.id || null;
  //     } else {
  //       grandQueueId = parentQueue?.grand_parent_queue_id || null;
  //     }

  //     // apply delay
  //     if (task.action === 'delay_action') {
  //       triggerAt = addHours(triggerAt, task.config?.duration || 0);
  //     }

  //     // construct queue item
  //     const queue = {
  //       id: uid,
  //       task_action: task.action,
  //       task_pos: task.pos,
  //       task_config: task.config,
  //       task_data: input,
  //       workflow_id: task.workflow_id,
  //       status: QueueTask.STATUSES.PENDING,
  //       task_id: task.id,
  //       task_parent_id: task.parent_task_id,
  //       parent_queue_id: parentQueue?.id || null,
  //       grand_parent_queue_id: grandQueueId,
  //       trigger_at: triggerAt,
  //     };
  //     queueItems.push(queue);

  //     // child tasks
  //     const childs = tasks.filter((d) => d.parent_task_id === task.id);
  //     childs.forEach((d) => generateQueue(d, triggerAt));
  //   }

  //   const rootTasks = tasks.filter((d) => d.parent_task_id === null);
  //   rootTasks.forEach((d) => generateQueue(d));

  //   // DB update
  //   await this.model.bulkCreate(queueItems, options);

  //   return queueItems;
  // }
  // using DB tracker
  // async pushQueueTask2(queueId) {
  //   const queueItem = await this.model.findByPk(queueId);
  //   console.log('Push queue:', queueId, queueItem.task_action);

  //   // sync driver
  //   await this.runQueueTask2(queueId);
  // }

  // async runQueueTask2(queueId) {
  //   const queueItem = await this.model.findByPk(queueId);
  //   // if (queueItem.status === QueueTask.STATUSES.COMPLETED) {
  //   //   console.log('Queue task already completed.');
  //   //   return;
  //   // }
  //   // if (queueItem.status !== QueueTask.STATUSES.FAILED) {
  //   //   console.log('Queue task already triggered.');
  //   //   return;
  //   // }

  //   console.log('Trigger:', queueItem.task_action, queueItem.trigger_at);
  //   const { result, pos } = await this.runTask(queueItem.task_action, queueItem.task_data, queueItem.task_config);
  //   console.log(result, pos);

  //   queueItem.execute_at = new Date();
  //   queueItem.status = QueueTask.STATUSES.COMPLETED;
  //   queueItem.result_obj = result;
  //   await queueItem.save();

  //   // prepare next queue item
  //   const chainedItems = await this.model.findAll({
  //     attributes: ['id', 'task_pos'],
  //     where: {
  //       parent_queue_id: queueItem.id,
  //     },
  //     raw: true,
  //   });
  //   if (!chainedItems?.length) {
  //     console.log('Trigger completed');
  //     return;
  //   }
  //   const items = chainedItems.reduce((acc, cur) => ({
  //     ...acc,
  //     [cur.task_pos || '']: cur.id,
  //   }), {});
  //   // console.log(chainedItems, items);

  //   const nextQueueItemId = items[pos || ''] || null;
  //   if (!nextQueueItemId) {
  //     console.log('Something wrong... Trigger stopped');
  //     return;
  //   }
  //   await this.pushQueueTask(nextQueueItemId);
  // }

  async runTask(action, data, config) {
    // available actions
    // - send_user_email
    // - send_user_sms
    // - send_user_whatsapp
    // - send_email
    // - send_sms
    // - send_whatsapp
    // - call_api
    // - delay_action

    // delay
    if (action === 'delay_action') {
      return {
        pos: null,
        result: null,
        modifier: {
          trigger_delay: config?.duration || 0,
        },
      };
    }

    // Email
    if (action === 'send_email') {
      // invalid config check
      if (!config?.email || !config?.message) {
        throw new Error('Invalid send_email node config');
      }

      const message = strMap(config.message, data);
      const params = {
        subject: `New Enrolment for ${data.campaign?.name}`,
        to: config?.email,
        content: message,
        throwErr: true,
      };
      await sendMail(params);
      return {
        pos: null,
        result: null,
        modifier: null,
      };
    }
    if (action === 'send_user_email') {
      // invalid config check
      if (!config?.template) {
        throw new Error('Invalid send_user_email node config');
      }
      const promises = data?.enrolments
        .filter((enrolment) => enrolment?.user?.email)
        .map((enrolment) => {
          const params = {
            subject: `Campaign Enrolment: ${data.campaign?.name}`,
            templateId: config.template,
            templateData: enrolment,
            to: enrolment.user.email,
          };
          return sendMailUsingTmpl(params);
        });
      await promises.all();

      return {
        pos: null,
        result: null,
        modifier: null,
      };
    }

    // SMS
    if (action === 'send_sms') {
      // invalid config check
      if (!config?.number || !config?.message) {
        throw new Error('Invalid send_sms node config');
      }

      const message = strMap(config.message, data);
      const params = {
        to: config?.number,
        message,
        throwErr: true,
      };
      await sendSMS(params);
      return {
        pos: null,
        result: null,
        modifier: null,
      };
    }
    if (action === 'send_user_sms') {
      // invalid config check
      if (!config?.template) {
        throw new Error('Invalid send_user_email node config');
      }
      if (!data?.user?.contact) {
        throw new Error('Invalid user.contact');
      }
      // @tbc
      // const params = {
      //   to: data?.user?.contact,
      //   message: config?.message,
      //   throwErr: true,
      // };
      // await sendSMS(params);
      return {
        pos: null,
        result: null,
        modifier: null,
      };
    }

    // Whatsapp
    if (action === 'send_whatsapp') {
      // invalid config check
      if (!config?.number || !config?.message) {
        throw new Error('Invalid send_whatsapp node config');
      }
      // const params = {
      //   to: config?.number,
      //   message: config?.message,
      //   throwErr: true,
      // };
      // await sendSMS(params);
      return {
        pos: null,
        result: null,
        modifier: null,
      };
    }
    if (action === 'send_user_whatsapp') {
      // invalid config check
      if (!config?.template) {
        throw new Error('Invalid send_user_whatsapp node config');
      }
      if (!data?.user?.contact) {
        throw new Error('Invalid user.contact');
      }
      // @tbc
      // const params = {
      //   to: data?.user?.contact,
      //   message: config?.message,
      //   throwErr: true,
      // };
      // await sendSMS(params);
      return {
        pos: null,
        result: null,
        modifier: null,
      };
    }

    // API call
    if (action === 'call_api') {
      // invalid config check
      if (!config?.endpoint) {
        throw new Error('Invalid call_api node config');
      }

      const headers = {
        'Content-Type': 'application/json',
      };
      if (config?.auth_type === 'basic_auth') {
        const credentials = btoa(`${config?.username || ''}:${config?.password || ''}`);
        headers.Authorization = `Basic ${credentials}`;
      }
      if (config?.auth_type === 'bearer_token') {
        headers.Authorization = `Bearer ${config?.token || ''}`;
      }
      if (config?.auth_type === 'api_key') {
        headers[config?.key] = config?.value;
      }
      try {
        const response = await fetch(config.endpoint, {
          method: config?.method || 'GET',
          headers,
        });
        if (!response.ok) {
          throw new Error('Response not okay');
        }
        const result = await response.json();
        return {
          pos: 'true',
          modifier: null,
          result,
        };
      } catch (err) {
        return {
          pos: 'false',
          result: null,
          modifier: null,
        };
      }
    }

    return {
      pos: null,
      result: null,
      modifier: null,
    };
  }
}

module.exports = QueueService;
