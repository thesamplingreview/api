const ApiController = require('../ApiController');
const { sequelize, Product } = require('../../models');
const ProductService = require('../../services/ProductService');
const ProductResource = require('../../resources/ProductResource');

class ProductController extends ApiController {
  constructor() {
    super();

    this.productService = new ProductService();
  }

  /**
   * GET - all
   */
  async getAll(req, res) {
    try {
      const query = {
        where: await this.productService.genWhereQuery(req),
        order: await this.productService.genOrdering(req),
      };
      const { page, perPage } = this.getPaginate(req);
      const results = await this.productService.paginate(query, page, perPage);

      return this.responsePaginate(req, res, {
        data: ProductResource.collection(results.data),
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
      const record = await this.productService.findById(req.params.id);

      return this.responseJson(req, res, {
        data: new ProductResource(record),
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
      const result = await this.productService.create(formData, { transaction: t });

      t.commit();
      return this.responseJson(req, res, {
        data: new ProductResource(result),
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
      const record = await this.productService.findById(req.params.id);
      const updated = await this.productService.update(record, formData, { transaction: t });

      t.commit();
      return this.responseJson(req, res, {
        data: new ProductResource(updated),
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
      const record = await this.productService.findById(req.params.id);
      const deleted = await this.productService.delete(record, { transaction: t });

      t.commit();
      return this.responseJson(req, res, {
        data: new ProductResource(deleted),
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
    const options = {
      statuses: Object.values(Product.STATUSES).map((val) => ({
        id: val,
        name: val.charAt(0).toUpperCase() + val.slice(1),
      })),
    };

    return this.responseJson(req, res, {
      data: options,
    });
  }
}

module.exports = ProductController;
