// const { Sequelize } = require('sequelize');
const ApiController = require('../ApiController');
const {
  sequelize, Campaign, Product, Form, Vendor, User,
} = require('../../models');
const CampaignService = require('../../services/CampaignService');
const CampaignResource = require('../../resources/CampaignResource');

class CampaignController extends ApiController {
  constructor() {
    super();

    this.campaignService = new CampaignService();
  }

  /**
   * GET - all
   */
  async getAll(req, res) {
    try {
      const query = {
        where: await this.campaignService.genWhereQuery(req),
        order: await this.campaignService.genOrdering(req),
      };
      const { page, perPage } = this.getPaginate(req);
      const results = await this.campaignService.paginate(query, page, perPage);

      return this.responsePaginate(req, res, {
        data: CampaignResource.collection(results.data),
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
      const record = await this.campaignService.findById(req.params.id, {
        include: [
          { model: Vendor },
          { model: Form },
          { model: Product },
          { model: User },
        ],
      });

      return this.responseJson(req, res, {
        data: new CampaignResource(record),
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
      slug: req.body.slug,
      description: req.body.description,
      cover: req.body.cover,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      vendor_id: req.vendor?.id,
      form_id: req.form?.id,
      status: req.body.status,
      pos: req.body.pos,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const result = await this.campaignService.create(formData, { transaction: t });

      t.commit();
      return this.responseJson(req, res, {
        data: new CampaignResource(result),
      });
    } catch (err) {
      t.rollback();
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
      slug: req.body.slug,
      description: req.body.description,
      cover: req.body.cover,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      vendor_id: req.vendor?.id,
      form_id: req.form?.id,
      status: req.body.status,
      pos: req.body.pos,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.campaignService.findById(req.params.id);
      const updated = await this.campaignService.update(record, formData, { transaction: t });

      t.commit();
      return this.responseJson(req, res, {
        data: new CampaignResource(updated),
      });
    } catch (err) {
      t.rollback();
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
      const record = await this.campaignService.findById(req.params.id);
      const deleted = await this.campaignService.delete(record, { transaction: t });

      t.commit();
      return this.responseJson(req, res, {
        data: new CampaignResource(deleted),
      });
    } catch (err) {
      t.rollback();
      return this.responseError(req, res, err);
    }
  }

  /**
   * GET - options
   */
  async options(req, res) {
    const forms = await Form.findAll({
      attributes: ['id', 'name'],
    });

    const options = {
      forms,
      statuses: Object.values(Campaign.STATUSES).map((val) => ({
        id: val,
        name: val.charAt(0).toUpperCase() + val.slice(1),
      })),
    };

    return this.responseJson(req, res, {
      data: options,
    });
  }

  /**
   * PUT - add products
   */
  async updateProducts(req, res) {
    // validated
    const formData = {
      products: req.body.products,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.campaignService.findById(req.params.id);
      const updated = await this.campaignService.syncProducts(record, formData.products, { transaction: t });

      t.commit();
      return this.responseJson(req, res, {
        data: updated,
      });
      // return this.responseJson(req, res, {
      //   data: new CampaignResource(updated),
      // });
    } catch (err) {
      t.rollback();
      return this.responseError(req, res, err);
    }
  }
}

module.exports = CampaignController;
