const { Sequelize } = require('sequelize');
const ApiController = require('../ApiController');
const { sequelize, Campaign, FormField, FormFieldOption } = require('../../models');
const FormService = require('../../services/FormService');
const FormResource = require('../../resources/FormResource');

class FormController extends ApiController {
  constructor() {
    super();

    this.formService = new FormService();
  }

  /**
   * GET - all
   */
  async getAll(req, res) {
    try {
      const query = {
        where: await this.formService.genWhereQuery(req),
        order: await this.formService.genOrdering(req),
        include: [
          { model: Campaign },
        ],
        attributes: {
          include: [
            [Sequelize.literal('(SELECT COUNT(*) FROM `form_fields` AS `Fields` WHERE `Fields`.`form_id` = `Form`.`id`)'), 'fieldsCount'],
          ],
        },
        distinct: true,
      };
      const { page, perPage } = this.getPaginate(req);
      const results = await this.formService.paginate(query, page, perPage);

      return this.responsePaginate(req, res, {
        data: FormResource.collection(results.data),
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
      const record = await this.formService.findById(req.params.id, {
        include: [
          {
            model: FormField,
            include: [FormFieldOption],
          },
        ],
        order: [
          [FormField, 'pos', 'ASC'],
        ],
      });

      return this.responseJson(req, res, {
        data: new FormResource(record),
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * POST - create
   */
  async create(req, res) {
    // validated
    const formData = {
      name: req.body.name,
      description: req.body.description,
      cover: req.body.cover,
      fields: req.body.fields,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const result = await this.formService.create(formData, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new FormResource(result),
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
    // validated
    const formData = {
      name: req.body.name,
      description: req.body.description,
      cover: req.body.cover,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.formService.findById(req.params.id, {
        // include: [
        //   { model: FormField },
        // ],
      });
      const updated = await this.formService.update(record, formData, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new FormResource(updated),
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }

  /**
   * PUT - update fields
   */
  async updateFields(req, res) {
    // validated
    const formData = {
      fields: req.body.fields,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.formService.findById(req.params.id, {
        include: [
          { model: FormField },
        ],
      });
      const updated = await this.formService.update(record, formData, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new FormResource(updated),
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
      const record = await this.formService.findById(req.params.id);
      const deleted = await this.formService.delete(record, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new FormResource(deleted),
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
}

module.exports = FormController;
