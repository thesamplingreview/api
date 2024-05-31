const { Op } = require('sequelize');
const { addHours } = require('date-fns');
const configApp = require('../../config/app');
const { strMap } = require('../helpers/utils');
const { consoleLog } = require('../helpers/logger');
const { sendMail, sendMailUsingTmpl } = require('../helpers/mailer');
const { sendSMS } = require('../helpers/sms');
const { sendWhatsAppTmpl } = require('../helpers/whatsapp');
const { pushQueue } = require('../helpers/queue');
const BaseService = require('./BaseService');
const {
  sequelize, User, QueueTask, WorkflowTask, CampaignEnrolment,
} = require('../models');

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
      // push to sqs
      await pushQueue({
        data: { queue_id: queue.id },
        // delay: 300,
      });
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
      consoleLog('RunQueueErr:', 'Invalid queue');
      return;
    }
    // prevent re-run of queue
    if (queue.status !== QueueTask.STATUSES.PENDING) {
      consoleLog('RunQueueErr:', 'Queue already triggered - end', queue.id);
      return;
    }

    consoleLog('RunQueue:', 'Run queue ID', queue.id);
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
      consoleLog('RunQueue:', 'Run queue ID - end', queue.id);

      const nextTaskId = await this.findNextTaskId(queue, pos);
      if (!nextTaskId) {
        consoleLog('RunQueue:', 'End of queue workflow tree', queue.id);
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
      consoleLog('RunQueueErr:', 'Error detected', err.message);

      // apply retry
      // @todo: need to apply delay on retry
      if (queue.retry_count < 1) {
        queue.retry_count += 1;
        consoleLog('RunQueue:', 'Retrying queue ID', queue.id, queue.retry_count);
        await queue.save();
        await this.runQueueTask(queue);
      } else {
        consoleLog('RunQueueErr:', 'All queue retries failed - end', queue.id);
        queue.status = QueueTask.STATUSES.FAILED;
        queue.execute_at = new Date();
        queue.error_message = err.message;
        await queue.save();

        // proceed next
        // @tbc
        const nextTaskId = await this.findNextTaskId(queue, null);
        if (!nextTaskId) {
          consoleLog('RunQueue:', 'End of queue workflow tree', queue.id);
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

  async runTask(action, data, config) {
    /**
     * Available actions
     * - send_user_email
     * - send_user_sms
     * - send_user_whatsapp
     * - send_email
     * - send_sms
     * - send_whatsapp
     * - call_api
     * - delay_action (disabled for SQS flow)
     */

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
        subject: `New Enrolment Alert from ${configApp.name}`,
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
      if (!data?.campaign?.id) {
        throw new Error('Invalid send_user_email data');
      }

      const subject = strMap(config.subject || 'Thank you for interested', data);
      const enrolments = await this.getAffectedEnrolments(data);
      const promises = enrolments
        .filter((enrolment) => enrolment.user.email?.trim())
        .map((enrolment) => {
          const params = {
            subject,
            templateId: config.template,
            templateData: enrolment,
            to: enrolment.user.email,
          };
          return sendMailUsingTmpl(params);
        });
      // swallow errors
      // await Promise.allSettled(promises);
      await this.batchedPromises(promises, 10, 1000);

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
        throw new Error('Invalid send_user_sms node config');
      }
      if (!data?.campaign?.id) {
        throw new Error('Invalid send_user_sms data');
      }

      const enrolments = await this.getAffectedEnrolments(data);
      const promises = enrolments
        .filter((enrolment) => enrolment.user.contact?.trim())
        .map((enrolment) => {
          const params = {
            to: enrolment.user.contact,
            message: 'SMS blast message for enrolment',
            throwErr: true,
          };
          return sendSMS(params);
        });
      // swallow errors
      // await Promise.allSettled(promises);
      await this.batchedPromises(promises, 10, 1000);

      return {
        pos: null,
        result: null,
        modifier: null,
      };
    }

    // Whatsapp
    if (action === 'send_whatsapp') {
      // invalid config check
      if (!config?.number || !config?.template) {
        throw new Error('Invalid send_whatsapp node config');
      }
      const params = {
        to: config.number,
        templateName: config.template,
        // input: {},
        // inputOrder: [],
        throwErr: true,
      };
      await sendWhatsAppTmpl(params);
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
      if (!data?.campaign?.id) {
        throw new Error('Invalid send_user_whatsapp data');
      }

      const enrolments = await this.getAffectedEnrolments(data);
      const promises = enrolments
        .filter((enrolment) => enrolment.user.contact?.trim())
        .map((enrolment) => {
          const params = {
            to: enrolment.user.contact,
            templateName: config.template,
            // input: {},
            // inputOrder: [],
            throwErr: true,
          };
          return sendWhatsAppTmpl(params);
        });
      // swallow errors
      // await Promise.allSettled(promises);
      await this.batchedPromises(promises, 10, 1000);

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

    // fallback
    return {
      pos: null,
      result: null,
      modifier: null,
    };
  }

  /**
   * Retrieve affected enrolments for node (DB)
   *
   * @param  {object}  taskData - node task_data
   * @return {array}
   */
  async getAffectedEnrolments(taskData) {
    // have enrolment - return as single
    if (taskData?.enrolment) {
      return [taskData.enrolment];
    }
    // invalid taskData huh?
    if (!taskData?.campaign?.id) {
      return [];
    }

    const enrolments = await CampaignEnrolment.findAll({
      where: {
        campaign_id: taskData.campaign.id,
        status: {
          [Op.ne]: CampaignEnrolment.STATUSES.REJECT,
        },
      },
      include: [
        { model: User },
      ],
    });

    return enrolments.map((enrolment) => ({
      id: enrolment.id,
      user: {
        id: enrolment.User?.id,
        name: enrolment.User?.name,
        email: enrolment.User?.email,
        contact: enrolment.User?.contact,
      },
    }));
  }

  /**
   * Batch trigger promises
   */
  async batchedPromises(promises, batchSize = 10, delay = 300) {
    // helpers
    const sleep = (ms) => new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

    /* eslint-disable no-restricted-syntax, no-await-in-loop */
    for (let i = 0; i < promises.length; i += batchSize) {
      if (i > 0) {
        await sleep(delay);
      }
      const batch = promises.slice(i, i + batchSize);
      await Promise.allSettled(batch);
    }
    /* eslint-enable no-restricted-syntax, no-await-in-loop */
  }
}

module.exports = QueueService;
