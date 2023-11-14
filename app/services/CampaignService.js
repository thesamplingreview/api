const { Op } = require('sequelize');
const { getInput, toDate } = require('../helpers/utils');
const { s3Upload, s3Remove } = require('../helpers/upload');
const BaseService = require('./BaseService');
const { Campaign, CampaignProduct } = require('../models');

class CampaignService extends BaseService {
  constructor() {
    super(Campaign);
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

  async create(input, options = {}) {
    const formData = {
      slug: input.slug,
      name: input.name,
      description: input.description || null,
      meta_title: input.meta_title || null,
      meta_description: input.meta_description || null,
      meta_keywords: input.meta_keywords || null,
      start_date: toDate(input.start_date, null),
      end_date: toDate(input.end_date, null),
      vendor_id: input.vendor_id || null,
      form_id: input.form_id || null,
      status: input.status || Campaign.STATUSES.ACTIVE,
      pos: input.pos || 0,
    };
    if (input.cover?.filepath) {
      const s3Url = await s3Upload(input.cover, 'campaigns');
      if (s3Url) {
        formData.cover_url = s3Url;
      }
    }

    const result = await this.model.create(formData, options);

    return result;
  }

  async update(record, input, options = {}) {
    const formData = {
      slug: getInput(input.slug, record.slug),
      name: getInput(input.name, record.name),
      description: getInput(input.description, record.description),
      meta_title: getInput(input.meta_title, record.meta_title),
      meta_description: getInput(input.meta_description, record.meta_description),
      meta_keywords: getInput(input.meta_keywords, record.meta_keywords),
      start_date: input.start_date !== undefined ? toDate(input.start_date, null) : record.start_date,
      end_date: input.end_date !== undefined ? toDate(input.end_date, null) : record.end_date,
      vendor_id: getInput(input.vendor_id, record.vendor_id),
      form_id: getInput(input.form_id, record.form_id),
      status: getInput(input.status, record.status),
      pos: getInput(input.pos, record.pos),
    };
    if (input.cover !== undefined && input.cover?.filepath) {
      const s3Url = await s3Upload(input.cover, 'campaigns', {
        replace: record.cover_url,
      });
      if (s3Url) {
        formData.cover_url = s3Url;
      }
    } else if (input.cover !== undefined) {
      if (record.cover_url) {
        await s3Remove(record.cover_url);
      }
      formData.cover_url = null;
    }
    const result = await record.update(formData, options);

    return result;
  }

  /**
   * Sync campaign <> products dataset
   * - this method using create / update approach (multi-query)
   * - this method will auto-cleanup old records if the record was not included inside `products`
   *
   * @param  {model}  record
   * @param  {array}  products
   * @param  {object}  options - sequelize transaction
   * @return {model[]}
   */
  async syncProducts(record, products, options = {}) {
    if (!products.length) {
      return [];
    }

    // create / update
    const promises = products.filter((product) => product.id)
      .map(async (product) => {
        const key = {
          campaign_id: record.id,
          product_id: product.id,
        };
        let linked = await CampaignProduct.findOne({
          where: key,
        }, options);
        if (!linked) {
          linked = CampaignProduct.build(key);
        }
        linked.filterable = product.filterable || false;
        linked.config = product.config || null;
        const result = await linked.save(options);

        return result;
      });

    const updated = await Promise.all(promises);

    // remove orphan record
    const updatedIds = updated.map((d) => d.id);
    await CampaignProduct.destroy({
      where: {
        id: { [Op.notIn]: updatedIds },
        campaign_id: record.id,
      },
    });

    return updated;
  }
}

module.exports = CampaignService;
