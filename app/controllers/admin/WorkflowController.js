const ApiController = require('../ApiController');
const {
  sequelize, WorkflowTask, Vendor,
} = require('../../models');
const WorkflowService = require('../../services/WorkflowService');
const QueueService = require('../../services/QueueService');
const WorkflowResource = require('../../resources/WorkflowResource');
const { ValidationFailed } = require('../../errors');

class WorkflowController extends ApiController {
  constructor() {
    super();

    this.workflowService = new WorkflowService();
  }

  /**
   * GET - all
   */
  async getAll(req, res) {
    try {
      const query = {
        where: this.workflowService.genWhereQuery(req),
        order: this.workflowService.genOrdering(req),
        include: [
          { model: WorkflowTask },
          { model: Vendor },
        ],
      };
      const { page, perPage } = this.getPaginate(req);
      const results = await this.workflowService.paginate(query, page, perPage);

      return this.responsePaginate(req, res, {
        data: WorkflowResource.collection(results.data),
        meta: results.meta,
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * GET - single
   */
  async getSingle(req, res) {
    try {
      const record = await this.workflowService.findById(req.params.id, {
        include: [
          { model: Vendor },
          { model: WorkflowTask },
        ],
      });

      return this.responseJson(req, res, {
        data: new WorkflowResource(record),
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * POST - create
   */
  async create(req, res) {
    // define allowed fields
    const formData = {
      name: req.body.name,
      vendor_id: req.body.vendor_id,
      created_by: req.user.id,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const result = await this.workflowService.create(formData, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new WorkflowResource(result),
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }

  /**
   * PUT - update
   */
  async update(req, res) {
    // define allowed fields
    const formData = {
      name: req.body.name,
      vendor_id: req.body.vendor_id,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.workflowService.findById(req.params.id);
      const updated = await this.workflowService.update(record, formData, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new WorkflowResource(updated),
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }

  /**
   * DELETE - remove
   */
  async remove(req, res) {
    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.workflowService.findById(req.params.id);
      const deleted = await this.workflowService.delete(record, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new WorkflowResource(deleted),
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }

  /**
   * GET - options
   */
  async options(req, res) {
    const options = {
      // ...silence is gold
    };

    return this.responseJson(req, res, {
      data: options,
    });
  }

  /**
   * PUT - add products
   */
  async updateTasks(req, res, next) {
    // validated
    const formData = {
      tasks: req.body.tasks,
    };

    // DB validated - task doesn't belongs to other workflow
    // *note 1: id can be new (not exists in DB)
    const taskIds = formData.tasks.map((d) => d.id);
    const tasks = await WorkflowTask.findAll({
      attributes: ['id', 'workflow_id'],
      where: {
        id: taskIds,
      },
      raw: true,
    });
    const invalid = tasks.some((d) => d.workflow_id !== req.params.id);
    if (invalid) {
      return next(new ValidationFailed('Invalid or duplicated task_id detected.'));
    }

    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.workflowService.findById(req.params.id);
      const updated = await this.workflowService.update(record, formData, { transaction: t });

      await t.commit();

      // reload
      await updated.reload({
        include: [
          { model: WorkflowTask },
          { model: Vendor },
        ],
      });

      return this.responseJson(req, res, {
        data: new WorkflowResource(updated),
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }

  /**
   * GET - trigger workflow
   */
  async triggerWorkflow(req, res) {
    // validated
    const formData = {
      campaign_id: 1,
    };

    const queueService = new QueueService();

    // DB update
    const transaction = await sequelize.transaction();
    try {
      const record = await this.workflowService.findById(req.params.id);
      const queueTasks = await queueService.generateQueueTasks(record, formData, { transaction });

      await transaction.commit();

      return this.responseJson(req, res, {
        data: queueTasks,
      });
    } catch (err) {
      await transaction.rollback();
      return this.responseError(req, res, err);
    }
  }

  async triggerQueue(req, res) {
    // validated
    // const queueId = '1715586003534_1';
    const taskId = '1715508652456';

    const queueService = new QueueService();

    // DB update
    try {
      await queueService.pushQueueTask(taskId, { campaign: 2 });

      return this.responseJson(req, res, {
        data: [],
      });
    } catch (err) {
      throw err;
      return this.responseError(req, res, err);
    }
  }
}

module.exports = WorkflowController;
