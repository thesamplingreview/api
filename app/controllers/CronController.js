const ApiController = require('./ApiController');
const {
  WorkflowTask, CampaignEnrolment, Campaign, User,
} = require('../models');
const QueueService = require('../services/QueueService');

class CronController extends ApiController {
  /**
   * GET - trigger pending queue task
   */
  async triggerQueueTask(req, res) {
    const queueService = new QueueService();
    const queueTask = await queueService.getNextQueue();
    if (!queueTask) {
      return this.responseJson(req, res, {
        data: 'No task',
      });
    }

    try {
      await queueService.runQueueTask(queueTask);
      return this.responseJson(req, res, {
        data: `Run job - ${queueTask.id}`,
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * TEST - testing init trigger of queue task from enrolment
   */
  async testWorkflowTrigger(req, res) {
    // @test data
    const enrolmentId = 14;
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
          return this.responseError(req, res, err);
        }
      }
    }

    return this.responseJson(req, res, {
      data: `${promises.length} tasks scheduled.`,
    });
  }
}

module.exports = CronController;
