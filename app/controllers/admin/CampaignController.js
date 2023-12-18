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
        include: [Form, Vendor],
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
      slug: req.body.slug,
      name: req.body.name,
      description: req.body.description,
      intro_title: req.body.intro_title,
      intro_description: req.body.intro_description,
      presubmit_title: req.body.presubmit_title,
      presubmit_description: req.body.presubmit_description,
      postsubmit_title: req.body.postsubmit_title,
      postsubmit_description: req.body.postsubmit_description,
      cover: req.body.cover,
      backgroound: req.body.background,
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
      slug: req.body.slug,
      name: req.body.name,
      description: req.body.description,
      intro_title: req.body.intro_title,
      intro_description: req.body.intro_description,
      presubmit_title: req.body.presubmit_title,
      presubmit_description: req.body.presubmit_description,
      postsubmit_title: req.body.postsubmit_title,
      postsubmit_description: req.body.postsubmit_description,
      cover: req.body.cover,
      background: req.body.background,
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
    const vendors = await Vendor.findAll({
      attributes: ['id', 'name'],
    });
    const products = await Product.findAll({
      attributes: ['id', 'name'],
      where: {
        status: Product.STATUSES.ACTIVE,
      },
      order: [['pos', 'ASC']],
    });

    const options = {
      forms,
      vendors,
      products,
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
