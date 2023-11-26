const { getInput } = require('../helpers/utils');
const { s3Upload, s3Remove } = require('../helpers/upload');
const BaseService = require('./BaseService');
const { Product } = require('../models');

class ProductService extends BaseService {
  constructor() {
    super(Product);
  }

  async genWhereQuery(req) {
    const whereQuery = {};

    return whereQuery;
  }

  async genOrdering(req) {
    // currently only support single column ordering
    const sort = super.getSortMeta(req);
    return sort ? [sort] : [['pos', 'ASC']];
  }

  async create(input) {
    const formData = {
      name: input.name,
      description: input.description || null,
      brand: input.brand || null,
      status: input.status || Product.STATUSES.ACTIVE,
      pos: input.pos || await this.count(),
    };
    if (input.image?.filepath) {
      const s3Url = await s3Upload(input.image, 'campaigns');
      if (s3Url) {
        formData.image_url = s3Url;
      }
    }

    const result = await this.model.create(formData);

    return result;
  }

  async update(record, input) {
    const formData = {
      name: getInput(input.name, record.name),
      description: getInput(input.description, record.description),
      brand: getInput(input.brand, record.brand),
      status: getInput(input.status, record.status),
      pos: getInput(input.pos, record.pos),
    };
    if (input.image !== undefined && input.image?.filepath) {
      const s3Url = await s3Upload(input.image, 'campaigns', {
        replace: record.image_url,
      });
      if (s3Url) {
        formData.image_url = s3Url;
      }
    } else if (input.image !== undefined) {
      if (record.image_url) {
        await s3Remove(record.image_url);
      }
      formData.image_url = null;
    }
    const result = await record.update(formData);

    return result;
  }
}

module.exports = ProductService;
