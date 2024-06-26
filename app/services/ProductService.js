const { Op } = require('sequelize');
const { getInput } = require('../helpers/utils');
const { s3Upload, s3Remove } = require('../helpers/upload');
const BaseService = require('./BaseService');
const { Product, CampaignProduct } = require('../models');

class ProductService extends BaseService {
  constructor() {
    super(Product);
  }

  genWhereQuery(req) {
    const whereQuery = {};

    // filter - name
    if (req.query.name?.trim()) {
      whereQuery.name = {
        [Op.like]: `%${req.query.name}%`,
      };
    }
    // filter - status
    if (req.query.status) {
      whereQuery.status = req.query.status;
    }
    // filter - vendor_id
    if (req.query.vendor_id) {
      whereQuery.vendor_id = req.query.vendor_id;
    }
    // filter - brand
    if (req.query.brand?.trim()) {
      whereQuery.brand = {
        [Op.like]: `%${req.query.brand}%`,
      };
    }

    return whereQuery;
  }

  genIncludeQuery(req) {
    const include = [];

    // filter - campaign_id
    if (req.query.campaign_id) {
      include.push({
        model: CampaignProduct,
        attributes: ['product_id', 'campaign_id'],
        where: {
          campaign_id: req.query.campaign_id,
        },
      });
    }

    return include;
  }

  genOrdering(req) {
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
      vendor_id: input.vendor_id || null,
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
      vendor_id: getInput(input.vendor_id, record.vendor_id),
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
