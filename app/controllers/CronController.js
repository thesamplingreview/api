const ApiController = require('./ApiController');
const {
  WorkflowTask, CampaignEnrolment, Campaign, User,
} = require('../models');
const QueueService = require('../services/QueueService');
const WorkflowService = require('../services/WorkflowService');

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
    const enrolmentId = 42;

    const workflowService = new WorkflowService();
    const queueTaskCount = await workflowService.triggerEnrolmentWorkflow(enrolmentId);

    return this.responseJson(req, res, {
      data: `${queueTaskCount} tasks scheduled.`,
    });
  }
}

module.exports = CronController;
