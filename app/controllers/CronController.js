const ApiController = require('./ApiController');
const QueueService = require('../services/QueueService');
const WorkflowService = require('../services/WorkflowService');
const { pushQueue } = require('../helpers/queue');
const { CampaignEnrolment, CampaignReview } = require('../models');

class CronController extends ApiController {
  /**
   * GET - trigger pending queue task
   */
  async triggerQueueTask(req, res) {
    const queueService = new QueueService();
    let queueTask;
    if (req.query.queue_id) {
      try {
        queueTask = await queueService.findById(req.query.queue_id);
      } catch (err) {
        // ...
      }
    } else {
      queueTask = await queueService.getNextQueue();
    }
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
    const workflowService = new WorkflowService();

    // @test data
    let queueTaskCount = 0;
    if (req.query.type === 'enrolment') {
      const enrolmentId = '36';
      const enrolment = await CampaignEnrolment.findByPk(enrolmentId);
      queueTaskCount = await workflowService.triggerWorkflowByEnrolment(enrolment);
    } else if (req.query.type === 'review') {
      const reviewId = '4';
      const review = await CampaignReview.findByPk(reviewId);
      queueTaskCount = await workflowService.triggerWorkflowByReview(review);
    }

    return this.responseJson(req, res, {
      data: `${queueTaskCount} tasks scheduled.`,
    });
  }

  /**
   * TEST - push queue
   */
  async testPushQueue(req, res) {
    const result = await pushQueue({
      data: { foo: 'Foo' },
      delay: 300,
    });

    return this.responseJson(req, res, {
      data: result,
    });
  }
}

module.exports = CronController;
