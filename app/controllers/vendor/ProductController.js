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
    // inject vendor-only filter
    req.query.vendor_id = req.user.vendor_id;

    try {
      const query = {
        include: this.productService.genIncludeQuery(req),
        where: this.productService.genWhereQuery(req),
        order: this.productService.genOrdering(req),
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
      const record = await this.productService.findOne({
        where: {
          id: req.params.id,
          vendor_id: req.user.vendor_id,
        },
      });

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
      brand: req.body.brand,
      description: req.body.description,
      image: req.body.image,
      status: req.body.status,
      pos: req.body.pos,
    };
    // system data
    formData.vendor_id = req.user.vendor_id;

    // DB update
    const t = await sequelize.transaction();
    try {
      const result = await this.productService.create(formData, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new ProductResource(result),
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
      brand: req.body.brand,
      description: req.body.description,
      image: req.body.image,
      status: req.body.status,
      pos: req.body.pos,
    };

    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.productService.findOne({
        where: {
          id: req.params.id,
          vendor_id: req.user.vendor_id,
        },
      });
      const updated = await this.productService.update(record, formData, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new ProductResource(updated),
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
      const record = await this.productService.findOne({
        where: {
          id: req.params.id,
          vendor_id: req.user.vendor_id,
        },
      });
      const deleted = await this.productService.delete(record, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new ProductResource(deleted),
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
